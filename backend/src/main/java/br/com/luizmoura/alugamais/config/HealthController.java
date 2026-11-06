package br.com.luizmoura.alugamais.config;

import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class HealthController {
    @GetMapping("/api/health")
    public Map<String, String> health() { return Map.of("status", "ok", "service", "AlugaMais API"); }
}

