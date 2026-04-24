---
description: Guardar cambios locales en la rama branch-local-only
---

# Guardar cambios locales

Cada vez que se realizan cambios en el proyecto, se deben guardar en la rama local `branch-local-only`.

> **IMPORTANTE**: Este repositorio es solo para cambios locales. **NUNCA** hacer push a un remoto.

## Pasos

// turbo-all

1. Verificar que estamos en la rama correcta:
```bash
cd /opt/lampp/htdocs/WWW/Nic && git checkout branch-local-only || git checkout -b branch-local-only
```

2. Agregar todos los archivos modificados:
```bash
cd /opt/lampp/htdocs/WWW/Nic && git add .
```

3. Hacer commit con un mensaje descriptivo **en español**:
```bash
cd /opt/lampp/htdocs/WWW/Nic && git commit -m "<descripción breve de los cambios en español>"
```

## Reglas

- Los mensajes de commit deben estar **siempre en español**.
- **Solo commits locales**, nunca `git push`.
- La rama se llama `branch-local-only`.
- Guardar cambios después de cada modificación significativa.