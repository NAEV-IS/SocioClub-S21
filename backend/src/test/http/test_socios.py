"""HTTP checks for a disposable, parent-started server; Python standard library only."""
import argparse
import html
import http.cookiejar
import ipaddress
import re
import unittest
import uuid
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import HTTPCookieProcessor, HTTPRedirectHandler, ProxyHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class SociosHTTP(unittest.TestCase):
    origin = None

    @classmethod
    def setUpClass(cls):
        cls.client = build_opener(ProxyHandler({}), NoRedirect(),
                                 HTTPCookieProcessor(http.cookiejar.CookieJar()))
        cls.surname = "Prueba" + uuid.uuid4().hex
        cls.used_dnis = set()

    def request(self, path, data=None):
        self.assertTrue(path.startswith("/") and not path.startswith("//"))
        request = Request(self.origin + path,
                          data=None if data is None else urlencode(data).encode())
        try:
            response = self.client.open(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read().decode("utf-8")

    def assertRedirectSocios(self, status, headers):
        self.assertEqual(status, 302)
        self.assertIn(re.sub(r";jsessionid=[0-9A-Fa-f]+$", "", headers["Location"]),
                      ("/socios", self.origin + "/socios"))

    def form(self, **changes):
        while True:
            dni = str(uuid.uuid4().int % 90000000 + 10000000)
            if dni not in self.used_dnis:
                self.used_dnis.add(dni)
                break
        data = dict(dni=dni, nombre="Ana", apellido=self.surname,
                    fechaNacimiento="1990-05-12", email="ana@example.test",
                    telefono="123456", estadoCuota="AL_DIA")
        data.update(changes)
        return data

    def listing(self, **query):
        status, _, body = self.request("/socios?" + urlencode(dict(apellido=self.surname, **query)))
        self.assertEqual(status, 200)
        return body

    def total(self):
        return int(re.search(r'data-total="(\d+)"', self.listing()).group(1))

    def create(self, **changes):
        data = self.form(**changes)
        before = self.total()
        status, headers, _ = self.request("/socios", data)
        self.assertEqual(status, 302)
        self.assertIn(re.sub(r";jsessionid=[0-9A-Fa-f]+$", "", headers["Location"]),
                      ("/socios", self.origin + "/socios"))
        body = self.listing()
        self.assertIn("Socio guardado correctamente.", body)
        self.assertIn('data-total="' + str(before + 1) + '"', body)
        match = re.search(r'<tr data-socio-id="(\d+)">\s*<td>' + data["dni"] + r'</td>', body)
        self.assertIsNotNone(match)
        return match.group(1), data

    def test_create_edit_and_mass_binding(self):
        status, _, form = self.request("/socios/nuevo")
        self.assertEqual(status, 200)
        self.assertIn("Nuevo socio", form)
        self.assertIn('value="AL_DIA" selected="selected"', form)
        socio_id, data = self.create(nombre="  Ana  ", estadoCuota="MOROSO", email="", telefono="")
        status, _, form = self.request("/socios/editar/" + socio_id)
        self.assertEqual(status, 200)
        self.assertIn('value="Ana"', form)
        self.assertIn('value="MOROSO" selected="selected"', form)
        before = self.total()
        data.update(id=socio_id, nombre="Beatriz", **{"inscripciones[0].id": "999999"})
        status, headers, _ = self.request("/socios", data)
        self.assertRedirectSocios(status, headers)
        self.assertEqual(self.total(), before)
        status, _, form = self.request("/socios/editar/" + socio_id)
        self.assertEqual(status, 200)
        self.assertIn('value="Beatriz"', form)
        self.assertIn('value="MOROSO" selected="selected"', form)

    def test_search_pagination_and_empty_results(self):
        group = self.surname + "Paginado"
        # Distinct surname keeps this independent of other checks and seed data.
        for number in range(11):
            status, headers, _ = self.request("/socios", self.form(apellido=group, nombre=str(number)))
            self.assertRedirectSocios(status, headers)
        search = group[6:].lower()
        status, _, first = self.request("/socios?" + urlencode({"apellido": "  " + search + "  "}))
        self.assertEqual(status, 200)
        self.assertIn('data-total="11"', first)
        ids = re.findall(r'data-socio-id="(\d+)"', first)
        self.assertEqual(len(ids), 10)
        links = [html.unescape(link) for link in re.findall(r'href="([^"]+)"', first)]
        next_link = next(link for link in links if parse_qs(urlsplit(link).query).get("page") == ["1"])
        self.assertEqual(parse_qs(urlsplit(next_link).query)["apellido"], [search])
        status, _, second = self.request(next_link)
        self.assertEqual(status, 200)
        second_ids = re.findall(r'data-socio-id="(\d+)"', second)
        self.assertEqual(len(second_ids), 1)
        self.assertFalse(set(ids) & set(second_ids))
        status, _, last = self.request("/socios?" + urlencode({"apellido": group, "page": "2147483647"}))
        self.assertEqual(status, 200)
        self.assertEqual(re.findall(r'data-socio-id="(\d+)"', last), second_ids)
        previous = [html.unescape(link) for link in re.findall(r'href="([^"]+)"', second)]
        self.assertTrue(any(parse_qs(urlsplit(link).query).get("page") == ["0"] for link in previous))
        status, _, empty = self.request("/socios?" + urlencode({"apellido": group + "Ausente"}))
        self.assertEqual(status, 200)
        self.assertIn("No hay socios para mostrar.", empty)
        for page in ("-1", "no-numero", "2147483648"):
            status, _, body = self.request("/socios?" + urlencode({"apellido": group, "page": page}))
            self.assertEqual(status, 200)
            self.assertEqual(re.findall(r'data-socio-id="(\d+)"', body), ids)

    def test_validation_leaves_data_unchanged(self):
        cases = [("dni", "", "Ingresá un DNI de 7 u 8 dígitos, sin puntos."),
                 ("dni", "123456", "Ingresá un DNI de 7 u 8 dígitos, sin puntos."),
                 ("dni", "12.345", "Ingresá un DNI de 7 u 8 dígitos, sin puntos."),
                 ("dni", "123456789", "Ingresá un DNI de 7 u 8 dígitos, sin puntos."),
                 ("nombre", " ", "Ingresá el nombre (hasta 255 caracteres)."),
                 ("apellido", " ", "Ingresá el apellido (hasta 255 caracteres)."),
                 ("nombre", "x" * 256, "Ingresá el nombre (hasta 255 caracteres)."),
                 ("fechaNacimiento", "", "Ingresá una fecha de nacimiento válida, no futura."),
                 ("fechaNacimiento", "no-fecha", "Ingresá una fecha de nacimiento válida, no futura."),
                 ("fechaNacimiento", "2999-01-01", "Ingresá una fecha de nacimiento válida, no futura."),
                 ("email", "no-email", "Ingresá un email válido (hasta 255 caracteres)."),
                 ("telefono", "x" * 256, "El teléfono admite hasta 255 caracteres."),
                 ("estadoCuota", "OTRO", "Seleccioná un estado de cuota válido.")]
        for field, value, message in cases:
            with self.subTest(field=field, value=value):
                before = self.total()
                status, _, body = self.request("/socios", self.form(**{field: value}))
                self.assertEqual(status, 200)
                self.assertIn(message, html.unescape(body))
                self.assertEqual(self.total(), before)
        # Rejected edits preserve the existing record, not just the count.
        socio_id, data = self.create()
        before = self.total()
        status, _, body = self.request("/socios", dict(data, id=socio_id, dni="abc", nombre="No guardar"))
        self.assertEqual(status, 200)
        self.assertIn("Ingresá un DNI", body)
        self.assertEqual(self.total(), before)
        status, _, form = self.request("/socios/editar/" + socio_id)
        self.assertEqual(status, 200)
        self.assertIn('value="Ana"', form)
        self.assertIn('value="' + data["dni"] + '"', form)

    def test_duplicate_dni_and_unchanged_edit(self):
        first_id, first = self.create()
        second_id, second = self.create()
        before = self.total()
        for data in (self.form(dni=first["dni"]), dict(second, id=second_id, dni=first["dni"])):
            status, _, body = self.request("/socios", data)
            self.assertEqual(status, 200)
            self.assertIn("Ya existe un socio con ese DNI.", body)
            self.assertEqual(self.total(), before)
        status, _, form = self.request("/socios/editar/" + second_id)
        self.assertEqual(status, 200)
        self.assertIn('value="' + second["dni"] + '"', form)
        status, headers, _ = self.request("/socios", dict(first, id=first_id))
        self.assertRedirectSocios(status, headers)
        self.assertEqual(self.total(), before)

    def test_invalid_ids_never_create_records(self):
        for value in ("abc", "0", "-1", "9223372036854775808", "9223372036854775807"):
            with self.subTest(id=value):
                before = self.total()
                status, headers, _ = self.request("/socios/editar/" + value)
                self.assertRedirectSocios(status, headers)
                status, _, body = self.request("/socios")
                self.assertEqual(status, 200)
                self.assertIn("El socio indicado no existe.", body)
                status, headers, body = self.request("/socios", self.form(id=value))
                self.assertIn(status, (200, 302))
                if status == 302:
                    self.assertIn(re.sub(r";jsessionid=[0-9A-Fa-f]+$", "", headers["Location"]),
                      ("/socios", self.origin + "/socios"))
                    status, _, body = self.request("/socios")
                    self.assertEqual(status, 200)
                self.assertIn("El socio indicado no existe.", body)
                self.assertEqual(self.total(), before)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", required=True, help="Explicit isolated origin, e.g. http://127.0.0.1:18081")
    parser.add_argument("--isolated", required=True, action="store_true",
                        help="Confirm this origin uses a disposable database; tests create socios")
    args, remaining = parser.parse_known_args()
    origin = urlsplit(args.origin)
    try:
        valid = (origin.scheme == "http" and ipaddress.ip_address(origin.hostname).is_loopback
                 and origin.port is not None and not origin.username and not origin.password
                 and origin.path in ("", "/") and not origin.query and not origin.fragment)
    except (ValueError, TypeError):
        valid = False
    if not valid:
        parser.error("--origin must be an explicit HTTP loopback IP origin with a port")
    SociosHTTP.origin = args.origin.rstrip("/")
    unittest.main(argv=[__file__] + remaining)
