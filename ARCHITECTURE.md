📘 ARCHITECTURE.md (TAM SÜRÜM)
# 🏗️ Beraber Admin Panel — ARCHITECTURE.md
Bu doküman, Beraber Admin Panel uygulamasının mimarisini, katman yapısını, veri akışını ve kullanılan altyapı bileşenlerini açıklamak için hazırlanmıştır.

---

# 1. 📐 MİMARİ GENEL YAPI
Proje, net bir katmanlı mimari üzerine kuruludur:

UI (React, MUI)
↓
Services (iş kuralları)
↓
Repositories (Firestore/Storage erişimi)
↓
Domain (types, schemas, mapper)
↓
Infrastructure (Firebase config)


Bu yapı sayesinde:

- UI sadece **Service** katmanıyla konuşur  
- Repository’ler Firebase ile konuşur  
- Domain modelleri tüm katmanlar arasında güvenli tip sağlar  
- Tüm bağımlılıklar **Dependency Injection (container.ts)** ile yönetilir  

---

# 2. KATMANLARIN DETAYI

## **2.1 UI Layer (src/pages, src/components)**
- React sayfaları ve görsel bileşenler burada bulunur.
- UI **asla Firestore veya Storage ile doğrudan konuşmaz**.
- Yalnızca service katmanını kullanır:

```ts
import { donationsService } from "@/data/container";
donationsService.update(...);


UI katmanının görevi:
kullanıcıyla etkileşim
formlar
listeler
modal pencereleri
progress/grafikler

2.2 Services Layer (src/data/services/)

Service katmanı, uygulamanın iş kurallarını barındırır.
Örneğin:
bağış güncelleme validasyonları
fotoğraf yükleme sonrası cache-bust oluşturma
arama (search)
kategori oranları toplama
dashboard hesaplamaları
Service asla Firestore ile konuşmaz; repository kullanır.

Örnek:

export class DonationsService {
  constructor(private repo: IDonationsRepo) {}
  update(id: string, patch: DonationWrite) {
    return this.repo.update(id, patch);
  }
}

2.3 Repositories Layer (src/data/repositories/)

Repository katmanı tek Firestore erişim noktasının olduğu yerdir:
addDoc()
updateDoc()
deleteDoc()
query()
onSnapshot()
uploadBytes()
getDownloadURL()
Tamamen Firebase SDK ile konuşan tek katmandır.
Bütün side-effect (datasource) işlemleri burada yapılır.
Örnek:

await updateDoc(doc(this.db, COLLECTIONS.DONATIONS, id), {...});


Bu katman yukarıdaki hiçbir katmanı bilmez (UI/Service/Router vs).

2.4 Domain Layer (src/domain/)
Bu katman tamamen tip güvenliği sağlar.
İçerik:

Zod schema’ları
Domain modelleri
Mapper fonksiyonları
Enum listeleri
İş kurallarıyla ilgisi olmayan saf yardımcı fonksiyonlar
Örnek domain tipi:

export interface Donation {
  id: string;
  name: string;
  amount: number;
  category: DonationCategory;
}


Mapper örneği:
export const toDonation = (id: string, raw: any): Donation => {...};


Domain katmanı:
Firestore'u bilmez
UI’ı bilmez
Repo’yu bilmez
Sadece veri modelini tanımlar.
2.5 Infrastructure Layer (src/infrastructure/)
Burada yalnızca Firebase config bulunur:
src/infrastructure/firebase.ts


İçeriği:
initializeApp()
getFirestore()
getStorage()
getAuth()
initializeAppCheck()
Environment değişkenleri okuma
Bu dosya yalnızca DI container tarafından kullanılır.
UI → Service → Repo → Domain zinciri Firebase katmanına dokunmaz.

3. 🔌 DEPENDENCY INJECTION (container.ts)
Tüm servis ve repository’ler burada oluşturulur:

src/data/container.ts


Yapı şöyle:

const donationsRepo = new FirestoreDonationsRepo(db, storage);
export const donationsService = new DonationsService(donationsRepo);


Avantajları:

Tüm Firestore instance tek noktada olur

Test / mock yazmak kolaylaşır

UI import’larının hepsi temiz olur

Örnek kullanım:

import { donationsService } from "@/data/container";

4. 🗂️ FIRESTORE KOLEKSİYONLARI
donations/

id
name
category
status
collected
createdBy
createdAt / updatedAt
photoUrl
highlights/
monthKey (YYYY-MM)
photoUrl
createdAt
community_posts/
photoUrl
text
status
createdBy
createdAt
team_members/
emailLower
active: boolean
role: "admin" | "user"

UI erişimi bu koleksiyona bağlı!
Admin panel whitelist’i buradan kontrol edilir.

users/
fcmTokens[]
createdAt
language
isBlocked
userStats/
month: "2025-03"
count: number
notifications/
title
body
scheduledAt
target
createdAt

5.  STORAGE KLASYAPISI
storage/
 └── donations/
       └── {donationId}/
             └── timestamp_filename.jpg

 └── community/
       └── {postId}/image.jpg


Foto yükleme logic'i Service içerisinde yönetilir.

6. 🔄 VERİ AKIŞI ÖZETİ
UI → Service → Repo → Firebase

Örnek akış — bağış kaydı güncelleme:
UI: donationsService.update(id, patch)
Service: patch'i doğrular → repo’ya yollar
Repo: updateDoc() ile Firestore’a yazar
Firestore snapshot → UI güncellenir

Benzer şekilde:
fotoğraf yükleme
arama yapma
kategorilere göre filtreleme
hepsi bu zincirle çalışır.

7. 🧪 Debug ve Log Yapısı

Tüm kritik Firebase işlemlerinde console.error() kullanılır.
Repo katmanı logları "[DonationsRepo.x]" prefix’i taşır.
UI tarafı hata göstermek için Notifier kullanır.

8. 🔐 Güvenlik

Admin panel kullanıcıları team_members whitelist üzerinden yönetilir.
Auth → email/password + App Check zorunlu.
Firestore rules katı şekilde kısıtlanmıştır.
Storage rules sadece image upload'a izin verir.

9. 🚀 DevOps ve Deploy

Build: pnpm build
Static deploy (Vercel/Netlify)
Public env değişkenleri → VITE_ prefix’i
App Check zorunlu olduğundan production’da reCaptcha v3 kullanılmalıdır.

10.  Sonuç

Bu yapı:
Temiz
Scalable
Test edilebilir
Güvenli
Maintainable
bir mimari sağlar.

Tüm servisler, repo’lar ve domain tipleri arasında net sınırlar çizilmiştir.