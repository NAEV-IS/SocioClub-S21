package com.losalgarrobos.socioclub.service;

import com.losalgarrobos.socioclub.model.Socio;
import com.losalgarrobos.socioclub.repository.SocioRepository;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocioService {
    private final SocioRepository socioRepository;

    public SocioService(SocioRepository socioRepository) {
        this.socioRepository = socioRepository;
    }

    @Transactional(readOnly = true)
    public Page<Socio> listar(String apellido, int pagina) {
        Sort orden = Sort.by("apellido", "nombre", "id");
        Page<Socio> resultado = socioRepository.findByApellidoContainingIgnoreCase(apellido,
                PageRequest.of(pagina > Integer.MAX_VALUE / 10 ? 0 : pagina, 10, orden));
        int ultima = Math.max(0, resultado.getTotalPages() - 1);
        if (pagina > ultima) {
            return socioRepository.findByApellidoContainingIgnoreCase(apellido, PageRequest.of(ultima, 10, orden));
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public Optional<Socio> buscarPorId(Long id) {
        return id == null || id < 1 ? Optional.empty() : socioRepository.findById(id);
    }

    @Transactional
    public void guardar(Socio datos) {
        Socio socio = datos.getId() == null ? new Socio() : buscarPorId(datos.getId())
                .orElseThrow(() -> new ReglaNegocioException("El socio indicado no existe."));
        socioRepository.findByDni(datos.getDni()).ifPresent(existente -> {
            if (!existente.getId().equals(socio.getId())) {
                throw new ReglaNegocioException("Ya existe un socio con ese DNI.");
            }
        });
        // Update the managed entity, never merge a request-bound association graph.
        socio.setDni(datos.getDni());
        socio.setNombre(datos.getNombre());
        socio.setApellido(datos.getApellido());
        socio.setFechaNacimiento(datos.getFechaNacimiento());
        socio.setEmail(datos.getEmail());
        socio.setTelefono(datos.getTelefono());
        socio.setEstadoCuota(datos.getEstadoCuota());
        // Flush inside this transaction so uniqueness races reach the controller after rollback.
        socioRepository.saveAndFlush(socio);
    }
}
