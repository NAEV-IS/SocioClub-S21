"""HTTP MVC checks. Requires an explicitly supplied, disposable seeded server; no DB access."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from html.parser import HTMLParser
from http.cookiejar import CookieJar
import ipaddress
import re
from threading import Barrier, local
import unittest
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPCookieProcessor, HTTPRedirectHandler, ProxyHandler, Request, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.rows = []
        self.selected = {}
        self.field = None
        self.meta = {}
        self.errors = []
        self._error = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'select':
            self.field = attrs.get('name')
        if tag == 'option' and self.field and 'selected' in attrs:
            self.selected.setdefault(self.field, []).append(attrs.get('value'))
        if tag == "p" and "alerta-error" in attrs.get("class", "").split():
            self.errors.append("")
            self._error = True
        if tag == "tr" and "data-inscripcion-id" in attrs:
            self.rows.append((int(attrs["data-inscripcion-id"]), int(attrs["data-socio-id"])))
        for key in ("data-cupo", "data-activas", "data-estado"):
            if key in attrs:
                self.meta[key] = attrs[key]

    def handle_data(self, data):
        if self._error:
            self.errors[-1] += data

    def handle_endtag(self, tag):
        if tag == 'select':
            self.field = None
        if tag == "p":
            self._error = False


class InscripcionesHTTP(unittest.TestCase):
    def setUp(self):
        self.clients = local()

    def request(self, path, data=None):
        # Separate cookie jars per concurrent client; retain flash messages across redirects.
        # No proxies or automatic redirects: never leave the explicitly approved origin.
        if not hasattr(self.clients, "opener"):
            self.clients.opener = build_opener(ProxyHandler({}), NoRedirect(), HTTPCookieProcessor(CookieJar()))
        req = Request(ORIGIN + path, None if data is None else urlencode(data).encode())
        try:
            response = self.clients.opener.open(req, timeout=20)
        except HTTPError as error:
            response = error
        with response:
            headers = dict(response.headers.items())
            if 'Location' in headers:
                target = urlsplit(headers['Location'])
                origin = urlsplit(ORIGIN)
                if target.scheme or target.netloc:
                    self.assertEqual((target.scheme, target.netloc), (origin.scheme, origin.netloc))
                self.assertTrue(target.path.startswith('/') and not target.path.startswith('//'))
                self.assertFalse(target.query or target.fragment)
                headers['Location'] = re.sub(r';jsessionid=[0-9a-fA-F]+$', '', target.path)
            return response.code, headers, response.read().decode("utf-8")

    def get(self, path):
        code, _, text = self.request(path)
        self.assertEqual(200, code, text)
        return text

    def listing(self, activity):
        page = Page(self.get(f"/inscripciones/actividad/{activity}"))
        self.assertEqual(len(page.rows), int(page.meta["data-activas"]))
        return int(page.meta["data-cupo"]), tuple(sorted(page.rows))

    def snapshot(self, activities):
        return {activity: self.listing(activity) for activity in activities}

    def create_activity(self, minimum=1, maximum=99, capacity=10):
        code, headers, text = self.request("/actividades", {
            "nombre": "Prueba HTTP inscripciones", "disciplina": "Bienestar",
            "profesor": "Prueba", "dias": "Lun", "horario": "10:00",
            "edadMinima": minimum, "edadMaxima": maximum,
            "cupoMaximo": capacity, "cuotaMensual": 0,
        })
        self.assertEqual(302, code, text)
        self.assertEqual("/actividades", headers["Location"])
        listing = self.get("/actividades")
        ids = re.findall(r'/actividades/editar/(\d+)', listing)
        self.assertTrue(ids, listing)
        return max(map(int, ids))

    def enroll(self, member, activity):
        return self.request("/inscripciones", {"socioId": member, "actividadId": activity})

    def accepted(self, member, activity):
        before_cupo, before_rows = self.listing(activity)
        code, headers, text = self.enroll(member, activity)
        self.assertEqual(302, code, text)
        self.assertEqual(f"/inscripciones/actividad/{activity}", headers["Location"])
        self.assertIn("Inscripción realizada correctamente.", self.get(headers["Location"]))
        cupo, rows = self.listing(activity)
        self.assertEqual(before_cupo - 1, cupo)
        added = set(rows) - set(before_rows)
        self.assertEqual(1, len(added))
        inscription, actual_member = added.pop()
        self.assertEqual(member, actual_member)
        self.assertEqual(len(before_rows) + 1, len(rows))
        return inscription

    def rejected(self, member, activity, message, watched):
        before = self.snapshot(watched)
        code, _, text = self.enroll(member, activity)
        self.assertEqual(200, code, text)
        self.assertEqual([message], Page(text).errors)
        selected = Page(text).selected
        self.assertEqual([str(member)], selected.get('socioId'))
        self.assertEqual([str(activity)], selected.get('actividadId'))
        self.assertEqual(before, self.snapshot(watched))

    def baja(self, inscription):
        code, headers, text = self.request(f"/inscripciones/{inscription}/baja", {"confirmar": "true"})
        self.assertEqual(302, code, text)
        self.assertRegex(headers["Location"], r"^/inscripciones/actividad/\d+$")
        self.assertEqual("BAJA", Page(self.get(f"/inscripciones/{inscription}/baja")).meta["data-estado"])

    def test_form_and_preserved_activity_pages(self):
        text = self.get("/inscripciones")
        self.assertIn('name="socioId"', text)
        self.assertIn('name="actividadId"', text)
        self.assertIn("Yoga", text)
        for path in ("/actividades", "/actividades/nueva", "/actividades/editar/8"):
            self.get(path)

    def test_yoga_capacity_baja_and_reenrollment(self):
        cupo, rows = self.listing(8)
        self.assertEqual(1, cupo, "Requires fresh seed: Yoga 14/15")
        self.assertEqual(14, len(rows))
        inscription = self.accepted(CAPACITY_SOCIOS[0], 8)
        self.rejected(CAPACITY_SOCIOS[1], 8, "La actividad no tiene cupo disponible", range(1, 9))
        before = self.listing(8)
        confirmation = self.get(f"/inscripciones/{inscription}/baja")
        self.assertIn("Confirmar baja", confirmation)
        self.assertEqual("ACTIVA", Page(confirmation).meta["data-estado"])
        self.assertEqual(before, self.listing(8), "GET must not mutate")
        code, headers, _ = self.request(f"/inscripciones/{inscription}/baja", {})
        self.assertEqual(302, code)
        self.assertEqual(["Confirmá la baja de la inscripción."], Page(self.get(headers["Location"])).errors)
        self.assertEqual(before, self.listing(8))
        self.baja(inscription)
        self.assertEqual((1, rows), self.listing(8))
        self.baja(inscription)  # Idempotent: never releases two places.
        self.assertEqual((1, rows), self.listing(8))
        again = self.accepted(CAPACITY_SOCIOS[0], 8)
        self.assertNotEqual(inscription, again, "BAJA history must not be overwritten")
        self.assertEqual("BAJA", Page(self.get(f"/inscripciones/{inscription}/baja")).meta["data-estado"])
        self.baja(again)
        self.assertEqual((1, rows), self.listing(8))

    def test_seed_baja_history_and_reenrollment(self):
        self.assertEqual("BAJA", Page(self.get("/inscripciones/22/baja")).meta["data-estado"])
        before = self.listing(4)
        inscription = self.accepted(5, 4)
        self.assertNotEqual(22, inscription)
        self.assertEqual("BAJA", Page(self.get("/inscripciones/22/baja")).meta["data-estado"])
        self.baja(inscription)
        self.assertEqual(before, self.listing(4))

    def test_rn2_duplicate_and_rn5_three_activities(self):
        self.rejected(5, 8, "El socio ya está inscripto en esta actividad", range(1, 9))
        self.rejected(4, 2, "Alcanzó el máximo de 3 actividades", range(1, 9))

    def test_rn3_age_today_inclusive_and_outside_range(self):
        self.rejected(1, 2, "La edad del socio debe estar entre 13 y 60 años", range(1, 9))
        today = date.today()  # Run coordinator/server in the same timezone, not across midnight.
        age = today.year - 1995 - ((today.month, today.day) < (11, 25))
        exact = self.create_activity(age, age)
        lower = self.create_activity(age + 1, age + 2)
        upper = self.create_activity(age - 2, age - 1)
        # Camila already has three; use Roberto (1980-06-30) for acceptance.
        roberto_age = today.year - 1980 - ((today.month, today.day) < (6, 30))
        boundary = self.create_activity(roberto_age, roberto_age)
        boundary_inscription = self.accepted(5, boundary)
        watched = list(range(1, 9)) + [exact, lower, upper, boundary]
        for activity, minimum, maximum in ((lower, age + 1, age + 2), (upper, age - 2, age - 1)):
            self.rejected(4, activity, f"La edad del socio debe estar entre {minimum} y {maximum} años", watched)
        # Exact-age passes RN3: RN5, not an age error, is returned.
        self.rejected(4, exact, "Alcanzó el máximo de 3 actividades", watched)
        self.baja(boundary_inscription)

    def test_rn4_arrears(self):
        self.rejected(3, 2, "Debe regularizar su cuota en secretaría", range(1, 9))

    def test_invalid_identifiers_do_not_mutate(self):
        before = self.snapshot(range(1, 9))
        for data in ({}, {"socioId": "bad", "actividadId": 8}):
            self.assertEqual(400, self.request("/inscripciones", data)[0])
        for member, activity, message in ((999999999, 8, "El socio no existe."),
                                          (5, 999999999, "La actividad no existe.")):
            code, _, text = self.enroll(member, activity)
            self.assertEqual(200, code, text)
            self.assertEqual([message], Page(text).errors)
        for path in ("/inscripciones/actividad/999999999", "/inscripciones/999999999/baja"):
            self.assertEqual(404, self.request(path)[0])
        self.assertEqual(404, self.request("/inscripciones/999999999/baja", {"confirmar": "true"})[0])
        self.assertEqual(before, self.snapshot(range(1, 9)))

    def race(self, attempts):
        barrier = Barrier(2)

        def submit(pair):
            barrier.wait(timeout=10)
            return self.enroll(*pair)

        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(submit, attempts))

    def test_competing_capacity_and_duplicate_writes(self):
        for members, capacity, rejection in (((9, 12), 1, "La actividad no tiene cupo disponible"),
                                              ((13, 13), 10, "El socio ya está inscripto en esta actividad")):
            activity = self.create_activity(capacity=capacity)
            results = self.race([(member, activity) for member in members])
            self.assertEqual([200, 302], sorted(result[0] for result in results))
            failure = next(result[2] for result in results if result[0] == 200)
            self.assertEqual([rejection], Page(failure).errors)
            cupo, rows = self.listing(activity)
            self.assertEqual(1, len(rows))
            self.assertEqual(capacity - 1, cupo)
            self.baja(rows[0][0])

    def test_competing_member_limit_and_place_recovery(self):
        # Oscar has Yoga only: one setup enrollment leaves exactly one place in his limit.
        activities = [self.create_activity() for _ in range(3)]
        setup = self.accepted(9, activities[0])
        results = self.race([(9, activity) for activity in activities[1:]])
        self.assertEqual([200, 302], sorted(result[0] for result in results))
        self.assertEqual(["Alcanzó el máximo de 3 actividades"],
                         Page(next(r[2] for r in results if r[0] == 200)).errors)
        states = [self.listing(activity) for activity in activities[1:]]
        self.assertEqual([0, 1], sorted(len(rows) for _, rows in states))
        for cupo, rows in states:
            self.assertEqual(10 - len(rows), cupo)
        winner = next(rows[0][0] for _, rows in states if rows)
        loser = next(activity for activity, (_, rows) in zip(activities[1:], states) if not rows)
        self.baja(winner)
        recovered = self.accepted(9, loser)
        self.baja(recovered)
        self.baja(setup)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Explicit http://loopback:port origin; no default")
    parser.add_argument("--isolated-test-database", required=True, action="store_true",
                        help="Confirm server uses a fresh disposable seed, never a real database")
    parser.add_argument("--capacity-socios", required=True, type=int, nargs=2, metavar=("FIRST", "SECOND"),
                        help="Two additional seeded AL_DIA adults, no active enrollments, eligible for Yoga")
    args = parser.parse_args()
    url = urlsplit(args.base_url)
    try:
        safe = (url.scheme == "http" and ipaddress.ip_address(url.hostname).is_loopback
                and url.port is not None and not url.username and not url.password
                and url.path in ("", "/") and not url.query and not url.fragment)
    except (ValueError, TypeError):
        safe = False
    if not safe:
        parser.error("--base-url must be a literal loopback HTTP origin with an explicit port")
    if len(set(args.capacity_socios)) != 2 or any(member <= 22 for member in args.capacity_socios):
        parser.error("--capacity-socios requires two distinct additional seeded member IDs above 22")
    ORIGIN = args.base_url.rstrip("/")
    CAPACITY_SOCIOS = args.capacity_socios
    unittest.main(argv=[__file__], verbosity=2)
