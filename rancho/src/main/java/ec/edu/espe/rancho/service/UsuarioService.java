package ec.edu.espe.rancho.service;


import ec.edu.espe.rancho.model.Personal;
import ec.edu.espe.rancho.model.Rol;
import ec.edu.espe.rancho.model.Usuario;
import ec.edu.espe.rancho.repository.PersonalRepository;
import ec.edu.espe.rancho.repository.RolRepository;
import ec.edu.espe.rancho.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PersonalRepository personalRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String generarUsuarios() {
        // Obtener datos para crear usuarios
        List<Personal> listaPersonal = personalRepository.findAll();
        Rol rolUsuario = rolRepository.findByNombre("usuario");

        int totalPersonal = listaPersonal.size();
        int usuariosCreados = 0;
        int usuariosExistentes = 0;
        int personalSinCedula = 0;

        for (Personal p : listaPersonal) {
            // Verificar si la cédula es nula o vacía
            if (p.getCedula() == null || p.getCedula().trim().isEmpty()) {
                personalSinCedula++;
                continue;
            }

            // Verificar si ya existe un usuario con esa cédula
            Optional<Usuario> usuarioExistente = usuarioRepository.findByNombreusuario(p.getCedula());
            if (usuarioExistente.isPresent()) {
                usuariosExistentes++;
                continue; // No tocar usuarios existentes
            }

            // Crear nuevo usuario solo si no existe
            Usuario u = new Usuario();
            u.setNombreusuario(p.getCedula());
            u.setContrasena(passwordEncoder.encode(p.getCedula()));
            u.setIdpersonal(p);
            u.setIdrol(rolUsuario);
            usuarioRepository.save(u);
            usuariosCreados++;
        }

        return String.format("Proceso completado: %d registros en Personal, %d usuarios nuevos creados, %d usuarios ya existían, %d registros sin cédula válida",
                           totalPersonal, usuariosCreados, usuariosExistentes, personalSinCedula);
    }

    public boolean cambiarContrasena(String nombreusuario, String nuevaContrasena) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreusuario(nombreusuario);
        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
            usuarioRepository.save(usuario);
            return true;
        }
        return false;
    }

}
