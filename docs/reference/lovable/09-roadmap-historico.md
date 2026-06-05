# 9. Histórico de Evolução (Resumo)

Funcionalidades entregues nas últimas iterações:

1. **Mapa e localização** — marcação da Casa da Paz (Rua Valério Eugênio, 570, Areal) com botões de abertura no Google Maps e Waze.
2. **Página /admin/auditoria** — visualização do `admin_audit_log` com:
   - Paginação server-side.
   - Filtros por papel, rota, usuário.
   - Ordenação multi-coluna (data, usuário, papel, rota).
   - Estados de loading/empty/feedback.
   - Exportação CSV e PDF.
3. **Auditoria expandida** — registros de IP, rota e motivo para exportações e mutações de eventos/usuários.
4. **Identidade umbandista** — imagens estratégicas (pretos velhos, atabaque, Iemanjá, ervas, velas) em galeria bento na home, banner em `/eventos`, backdrop no login.
5. **Otimização de imagens** — `SafeImage` com:
   - Lazy loading + `srcSet` responsivo + `sizes` mobile-first.
   - Detecção de `img.complete` para imagens em cache.
   - Telemetria de fallback (`image-telemetry.ts`).
   - Preload + `fetchpriority="high"` em hero e banner.
6. **Header simplificado** — removida linha de endereço sob "Casa da Paz", mantida mensagem principal.

## Próximos Passos Sugeridos

- Implementar i18n (pt-BR default; en opcional para visitantes).
- Adicionar dashboard de métricas (eventos mais visualizados, taxa de inscrição).
- Newsletter integrada a `eventos`.
- PWA / instalação no celular.
- Internacionalizar `admin_audit_log` (tradução de `rota`/`motivo`).
- Substituir CDN atual por uma com resize on-the-fly (Cloudflare Images / Supabase Storage transformations) para aproveitar 100% do `srcSet`.
