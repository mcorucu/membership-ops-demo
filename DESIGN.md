# Membership Ops design system

Membership Ops adapts the visual language of [Command Center](https://designmd.ai/frknaykc/command-center), an MIT-licensed reference published by DESIGNmd. The adaptation keeps the reference's two-layer composition: a warm, document-like workspace framed by a dark operational shell. It is intentionally an independent engineering sample; no Virtuagym branding, assets, or proprietary product language are used.

## Intent

The interface should feel focused, technical, and slightly premium without becoming futuristic chrome. The light workspace is where a user reads membership state and takes action. The dark rail is framing and navigation, not the entire application surface. Orange marks action, focus, telemetry, and the primary brand signal. Cards stay quiet so state, amounts, and the request lifecycle remain easy to scan.

## Tokens

| Role | Token |
| --- | --- |
| Background | `#fcfaf7` |
| On-background | `#423d38` |
| Surface | `#f3f4f6` |
| Surface-soft | `#edebe9` |
| Surface-elevated | `#ffffff` |
| Muted text | `#797067` |
| Outline | `#e3e0dd` |
| Primary | `#fe6e00` |
| Primary strong | `#ff6b00` |
| Primary warm | `#ffb74d` |
| Primary focus | `#f97015` |
| On-primary | `#ffffff` |
| Shell base | `#000000` |
| Shell content | `#ffffff` |
| Success | `#00c758` |
| Warning | `#edb200` |
| Danger | `#fb2c36` |
| Info | `#3080ff` |

Spacing uses a 4px base. The UI uses 4, 6, 8, and 12px corner radii, with a pill reserved for compact status labels. System sans is used for product text and system monospace is used for paths, stable codes, and request labels.

## Accessibility

The UI uses semantic `button`, `nav`, `main`, `form`, `label`, `fieldset`, and `legend` elements. Focus states are visible, inputs have labels, status is also written as text, and the layout collapses to a single column at small widths. Color is supplementary: a declined request still exposes its stable error code and message, not only a red treatment.

## Implementation map

- Tokens, responsive layout, focus treatment, and components: `apps/web/app/globals.css`
- Product shell and views: `apps/web/app/page.tsx`
- Build/runtime typography and security headers: `apps/web/app/layout.tsx` and `apps/web/next.config.ts`
- Request source explorer: `scripts/extract-developer-flow.mjs`

The design reference informed the visual direction, but the content hierarchy, copy, component names, and product behavior are specific to Membership Ops.
