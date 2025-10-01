# Clash of Clans - War Tracker

Sistema completo de gestión y análisis de guerras de Clash of Clans con métricas de desempeño, participación y efectividad.

## Características

### Gestión de Jugadores
- Importación masiva desde Excel
- Agregar jugadores manualmente (límite 50 por período)
- Búsqueda y filtrado en tiempo real
- Validación automática de estrellas máximas por ataques

### Métricas Automáticas
- **Participación**: Porcentaje de ataques realizados vs esperados
- **Efectividad**: Rendimiento de estrellas obtenidas
- **Desempeño**: Índice combinado (60% efectividad + 40% participación)
- Ordenamiento inteligente por TH y desempeño

### Sistema de Roles
- **Miembro**: Solo puede ver estadísticas
- **Colíder**: Puede modificar datos, agregar/eliminar jugadores
- **Líder**: Control total + gestión de usuarios + historial completo

### Historial Completo
- Registro de todos los cambios con autor y fecha
- Seguimiento de modificaciones de ataques y estrellas
- Log de cambios de roles y registros de usuarios
- Auditoría completa de acciones

### Funcionalidades Adicionales
- Exportación a Excel con todas las métricas
- Gestión de períodos de guerra
- Registro público automático (rol miembro por defecto)
- Interfaz responsiva con Tailwind CSS

## Stack Tecnológico

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT para autenticación
- bcrypt para encriptación de contraseñas

**Frontend:**
- HTML5 + JavaScript vanilla
- Tailwind CSS
- SheetJS para manejo de Excel

## Instalación Local
```bash