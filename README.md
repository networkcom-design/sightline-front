# Sightline — interfaz

Interfaz de [Sightline](https://github.com/networkcom-design/sightline), la
herramienta de auditoría de presencia digital para comercios y pymes.

El recorrido son seis pantallas: cargar el comercio, pegar la evidencia, revisar
los dictámenes de la IA, leer el informe, ajustar el presupuesto y enviárselo al
cliente.

---

## Las decisiones que importan

### El informe del cliente se abre sin cuenta

Crear auditorías pide sesión; **verlas no**. El enlace que se le manda al
comerciante funciona en cualquier navegador, sin registro y sin fricción.

Y no es el informe interno con campos ocultados: es un tipo de dato distinto que
llega de otro endpoint. Los precios, las horas estimadas y el origen de cada
dictamen **no viajan**. Si fuera el mismo objeto recortado con CSS, cualquier
descuido futuro se los mostraría al comercio que estás por cotizar.

### Cambia el registro tipográfico

Adentro de la aplicación es una herramienta: tipografía de sistema, números
monoespaciados, densidad alta. El informe del cliente es un documento: serif,
párrafos anchos, ritmo de lectura. El prospecto no recibe "una pantalla de un
software", recibe un diagnóstico con su nombre y su ciudad.

### Gráficos dibujados a mano

Sin librería de charts. Son tres formas simples, el SVG imprime nítido en el PDF
—que es donde el comerciante lo va a mirar— y no se suman doscientos kilobytes
al paquete para dibujar barras.

El color se eligió con un validador, no a ojo. La escala de niveles que había al
principio tenía dos verdes con una separación de 6,7 sobre 100 en visión normal:
no los distinguía nadie, ni con visión de color completa. Como el puntaje es una
magnitud ordenada, las barras usan una rampa de un solo tono de claro a oscuro, y
el rojo y el verde quedaron reservados para un par de estado verificado contra
daltonismo protán y deután. En todos los casos el número va escrito al lado: el
color nunca es el único canal.

### Imprime de verdad

El PDF sale de la impresión nativa del navegador, no de una librería que
rasteriza la pantalla: el texto se puede seleccionar y buscar. La hoja de
impresión fuerza el tema claro —si no, quien tenga el sistema en oscuro obtiene
un PDF con fondo negro—, conserva los colores de los medidores, que son
información y no adorno, y prohíbe que las tarjetas y las filas se corten entre
páginas.

### Enviar sin mandar nada

La aplicación redacta el mensaje para WhatsApp o correo y abre la conversación
con el texto cargado; **quien aprieta enviar es el usuario**. No hace falta la API
de WhatsApp Business, ni aprobación de Meta, ni un servidor de correo, y nadie
manda mensajes en nombre de otro.

---

## Correrlo

Hace falta Node 20 o superior, y el backend andando en `http://localhost:8080`.

```bash
npm install
```

```bash
npm run dev
```

Queda en `http://localhost:5175`.

La dirección de la API sale de `VITE_API_URL`, que ya viene configurada en
`.env.development` para desarrollo y en `.env.production` para el despliegue. Se
resuelve **al compilar**, no al ejecutar: cambiarla en el panel de Netlify no
tiene efecto hasta volver a desplegar.

### Compilar

```bash
npm run build
```

Corre `tsc -b` antes de empaquetar. Vale la pena saber por qué: el `tsconfig.json`
del andamio de Vite usa referencias de proyecto, y con referencias el
`tsc --noEmit` a secas **no revisa nada** y sale con éxito. Verificar con
`npm run build` es la única forma de que el chequeo de tipos sea real.

---

## Stack

React 19 con Vite y TypeScript. CSS plano, sin librería de componentes ni de
gráficos. La única dependencia además de React es el router.
