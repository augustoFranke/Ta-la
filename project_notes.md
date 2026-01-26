# Tá lá! - Notas do Projeto

> Informações valiosas para o desenvolvimento. Documento atualizado iterativamente.

---

## 📱 Ambiente de Testes

| Item | Configuração |
|------|--------------|
| **Método de teste** | Development Build (npx expo run:ios) |
| **Plataforma** | iOS |
| **Development builds** | ✅ Requerido (Firebase Auth) |

### Mudança para Development Build

O projeto migrou de **Expo Go** para **Development Build** devido à necessidade do Firebase Auth (verificação por telefone gratuita). Isso desbloqueia todas as funcionalidades nativas.

| Feature | Suporte Development Build |
|---------|--------------------------|
| Firebase Auth (Phone) | ✅ Funciona |
| Push Notifications (remote) | ✅ Funciona |
| Background Location | ✅ Funciona |
| Deep Linking | ✅ Funciona |
| Supabase Realtime | ✅ Funciona |
| Camera/Image Picker | ✅ Funciona |
| Location (foreground) | ✅ Funciona |
| Geofencing | ✅ Funciona |

### Configuração do Firebase

1. **Criar projeto no Firebase Console**: https://console.firebase.google.com
2. **Adicionar app iOS**: Project Settings → Your apps → Add app → iOS
3. **Bundle ID**: `com.tala.app`
4. **Baixar `GoogleService-Info.plist`**
5. **Adicionar ao Xcode**: Arrastar para a pasta `ios/Tl/`
6. **Habilitar Phone Auth**: Authentication → Sign-in method → Phone

---

## 🔧 Configurações do Projeto

- **Idioma**: Português (Brasil)
- **Região inicial**: Dourados, MS
- **Cor principal**: `#c1ff72`

---

## 📝 Decisões Técnicas

| Data | Decisão | Justificativa |
|------|---------|---------------|
| 2026-01-15 | Usar Expo Go para testes | Evitar necessidade de development builds |
| 2026-01-15 | Migrar para Firebase Auth | Supabase Auth cobra por verificação por telefone; Firebase é gratuito |
| 2026-01-15 | Usar Development Build | Firebase Auth requer código nativo (não funciona no Expo Go) |

---

## 🐛 Bugs Conhecidos

- **Inconsistência na Autenticação (Crítico)**:
    - `package.json` não possui as dependências do Firebase (nem JS SDK nem Native SDK).
    - `src/services/auth.ts` e `firebase.ts` usam importações do JS SDK (`firebase/auth`), mas `project_notes.md` indica uso de Native SDK.
    - `app/(auth)/login.tsx` e `verify.tsx` implementam UI de **Email**, enquanto o backend/services esperam **Telefone**.
    - `src/hooks/useAuth.ts` mistura lógica de Email e Telefone e possui variáveis indefinidas (`session`, `pendingEmail`).

---

## 💡 Ideias Futuras (Pós-MVP)

- [ ] Modo incógnito (premium)
- [ ] Super likes
- [ ] Filtros avançados de idade
- [ ] Verificação por redes sociais
- [ ] Fotos em chat
- [ ] Voice messages

---

## 📊 Progresso

| Fase | Status | Observações |
|------|--------|-------------|
| 1. Fundação | ✅ Concluído | Setup Expo, Supabase, estrutura de pastas |
| 2. Design System | ✅ Concluído | Theme, cores, componentes UI base |
| 3. Database | ✅ Concluído | Migrations SQL definidas |
| 4. Autenticação | 🔄 Em andamento | Migrando de Supabase Auth para Firebase Auth |
| 5. Google Places | ⬜ Pendente | - |
| 6. Home + Check-in | ⬜ Pendente | - |
| 7. Geofencing | ⬜ Pendente | Agora funciona com Development Build |
| 8. Descoberta | ⬜ Pendente | - |
| 9. Perfil Usuário | ⬜ Pendente | - |
| 10. Drinks | ⬜ Pendente | - |
| 11. Matches | ⬜ Pendente | - |
| 12. Chat | ⬜ Pendente | - |
| 13. Perfil Próprio | ⬜ Pendente | - |
| 14. Push | ⬜ Pendente | Agora funciona com Development Build |
| 15. Cache | ⬜ Pendente | - |
| 16. Analytics | ⬜ Pendente | - |
| 17. Polish | ⬜ Pendente | - |

---

_Última atualização: 2026-01-15_
