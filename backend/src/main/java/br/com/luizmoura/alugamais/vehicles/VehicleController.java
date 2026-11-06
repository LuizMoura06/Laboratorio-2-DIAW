package br.com.luizmoura.alugamais.vehicles;

import br.com.luizmoura.alugamais.database.Db;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final Db db;

    public VehicleController(Db db) { this.db = db; }

    @GetMapping
    public List<Map<String, Object>> all() {
        return db.list("SELECT id,registration,manufacturing_year AS \"manufacturingYear\",brand,model,plate,"
                + "owner_type AS \"ownerType\",owner_name AS \"ownerName\",daily_rate AS \"dailyRate\",category "
                + "FROM vehicles ORDER BY daily_rate");
    }

    @GetMapping("/{id}")
    public Map<String, Object> byId(@PathVariable UUID id) {
        return db.require("SELECT id,registration,manufacturing_year AS \"manufacturingYear\",brand,model,plate,"
                + "owner_type AS \"ownerType\",owner_name AS \"ownerName\",daily_rate AS \"dailyRate\",category "
                + "FROM vehicles WHERE id=?", id);
    }
}

