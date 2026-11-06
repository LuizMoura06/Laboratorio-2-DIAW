package br.com.luizmoura.alugamais.security;

import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

public record CurrentUser(UUID id, String username, String role) {
    public static CurrentUser get() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CurrentUser user))
            throw new ResponseStatusException(UNAUTHORIZED, "Faça login para continuar");
        return user;
    }

    public void requireRole(String expected) {
        if (!role.equals(expected)) throw new ResponseStatusException(FORBIDDEN, "Sem permissão para esta operação");
    }
}

