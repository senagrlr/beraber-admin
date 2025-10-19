// src/data/mockData.ts

export const mockTodoItems = [
  { id: 1, text: 'Yeni bağış kampanyası açılacak', completed: false },
  { id: 2, text: 'Okuyan Nesiller Kampanyası için fotoğraflar eklenecek', completed: false },
  { id: 3, text: 'Kullanıcılara test bildirimi gönderilecek.', completed: true },
  { id: 4, text: 'Pazartesi 21:00 toplantı yapılacak.', completed: false },
  { id: 5, text: 'Bug tracker oluşturulacak.', completed: false },
];

export const mockCompletedCampaigns = [
  { name: 'Okuyan Nesiller', date: '12/03/2025' },
  { name: 'Görmek herkesin hakkı', date: '09/03/2025' },
  { name: 'Yeşil Orman', date: '01/03/2025' },
  { name: 'Beraber Güçlüyüz', date: '25/02/2025' },
];

export const mockMonthlyUsers = [
  { month: 'Ocak', count: 500 }, { month: 'Şubat', count: 1200 },
  { month: 'Mart', count: 800 }, { month: 'Nisan', count: 1500 },
  { month: 'Mayıs', count: 600 }, { month: 'Haziran', count: 1400 },
  { month: 'Temmuz', count: 700 }, { month: 'Ağustos', count: 1100 },
  { month: 'Eylül', count: 400 }, { month: 'Ekim', count: 900 },
  { month: 'Kasım', count: 650 }, { month: 'Aralık', count: 1050 },
];
