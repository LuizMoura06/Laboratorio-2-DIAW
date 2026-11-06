package br.com.luizmoura.alugamais.rentals;

import br.com.luizmoura.alugamais.security.CurrentUser;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {
    private final RentalService service;

    public RentalController(RentalService service) { this.service = service; }

    @GetMapping
    public List<Map<String, Object>> all() { return service.list(CurrentUser.get()); }

    @GetMapping("/{id}")
    public Map<String, Object> detail(@PathVariable UUID id) { return service.byId(CurrentUser.get(), id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@RequestBody RentalService.RentalInput input) {
        return service.create(CurrentUser.get(), input);
    }

    @PutMapping("/{id}")
    public Map<String, Object> edit(@PathVariable UUID id, @RequestBody RentalService.RentalInput input) {
        return service.edit(CurrentUser.get(), id, input);
    }

    @PatchMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable UUID id) { return service.cancel(CurrentUser.get(), id); }

    @PatchMapping("/{id}/review")
    public Map<String, Object> review(@PathVariable UUID id, @RequestBody RentalService.ReviewInput input) {
        return service.review(CurrentUser.get(), id, input);
    }

    @PostMapping("/{id}/contract")
    public Map<String, Object> contract(@PathVariable UUID id, @RequestBody RentalService.ContractInput input) {
        return service.contract(CurrentUser.get(), id, input);
    }

    @GetMapping("/contracts")
    public List<Map<String, Object>> contracts() { return service.contracts(CurrentUser.get()); }

    @GetMapping("/banks")
    public List<Map<String, Object>> banks() { return service.bankAgents(); }
}

