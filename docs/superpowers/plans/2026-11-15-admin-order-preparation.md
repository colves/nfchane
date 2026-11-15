# NFCHane yönetim ve sipariş hazırlığı Implementation Plan

> For agentic workers: Use superpowers:executing-plans to implement task-by-task. No delegation needed.

**Goal:** Mevcut görünümü koruyarak güvenli yönetici girişi, ürün/sipariş yönetimi ve tam sipariş formu; satış/ödeme kapalı.

**Architecture:** Cloudflare Worker yalnız /api/* isteklerini işler, statik dosyaları ASSETS sunar. Supabase Auth PKCE ve HttpOnly çerez; publishable key + doğrulanmış kullanıcı JWT'si ile dar kapsamlı RPC. Servis anahtarı yok. Özel şemalar kapalı kalır. Sipariş kayıtları DB CHECK ile yalnız test kaydıdır ve yönetici gerektirir.

**Tech Stack:** Mevcut Vite/vanilla JS/CSS, Workers Web APIs, Supabase Postgres/Auth.

**Spec:** Kullanıcının 15 Kasım panel/form talebi ve docs/SUPABASE-ALTYAPI.md. Yönetici için Supabase hesabındaki e-posta kullanıcı tarafından açıkça seçildi. Şifre veya e-posta içeriği asistan tarafından okunmaz.

## Global Constraints

- Satış ve gerçek ödeme açılmaz; anonim kullanıcı sipariş yazamaz. Ekran düğmesi dışında Worker ve DB de kilitlidir.
- Mevcut 7 ürün/ölçü/şeffaf-3mm/NFC-static davranışı ve eski QR yönlendirmesi korunur.
- Ücretsiz planlar; yeni ücretli servis/analiz/çerez izleyicisi yok. Sipariş/contact verileri loglanmaz.
- Tasarım referansı mevcut NFCHane: Manrope, beyaz/yeşil, sade form alanları, mobil tek sütun; kartları taklit eden gereksiz görseller yok.

## Tasks

- [ ] Ortak validation.js: tüm iletişim/adres/fatura/ürün kişiselleştirmesi; Node testleri. Başka toplam, bozuk URL, geçersiz IBAN, NFC dynamic ve eksik alanlar reddedilir.
- [ ] Migration 003: yönetici allowlist, verified-email kimliği, audit/test alanları, RPC ürün/sipariş/kargo/fatura/test takip. RLS/private şema korunur. SQL rollback testleri: anonim/nonadmin ret, idempotency, metin/fiyat doğrulaması.
- [ ] Worker: PKCE e-posta girişi, güvenli çerez yenileme/çıkış, same-origin/JSON/body limit, admin RPC köprüsü, daima kapalı public checkout. Sahte fetch ile izin/CSRF/idempotency testleri.
- [ ] /yonetim/, /siparis/, /siparis-takibi/: erişilebilir formlar, test etiketleri, ürün fiyat/metin düzenleme, sipariş filtre/detay/durum, manuel kargo/fatura, güvenli takip. Kişisel form taslakları tarayıcıda kalıcı tutulmaz.
- [ ] Mevcut sepete sipariş hazırlığı bağlantısı; üyelik şartı yok fakat kamuya açık sipariş kabulü kapalı.
- [ ] Supabase migration + owner allowlist ve Auth redirect; Cloudflare Worker/runtime değişkenleri. Kullanıcıya e-posta doğrulamasını tamamlama adımı bırakılır; credential kopyalama yok.
- [ ] Node/SQL/build testleri, canlı public ret ve mobil görünüm, gizli anahtar taraması; main/Cloudflare yayın doğrulaması. İşletme fiyat/kargo bilgileri uydurulmaz.
