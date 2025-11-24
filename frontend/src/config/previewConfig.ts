// Mock navigation and menu items for preview mode

export const MAIN_NAVIGATION_ITEMS = [
  {
    id: 'home',
    label: 'Trang chủ',
    path: '/',
    children: [],
  },
  {
    id: 'about',
    label: 'Giới thiệu',
    path: '/gioithieu',
    children: [
      { title: 'Lịch sử hình thành', href: '/gioithieu#history' },
      { title: 'Ban lãnh đạo', href: '/gioithieu/ban-lanh-dao' },
      { title: 'Cơ cấu tổ chức', href: '/gioithieu#org-structure' },
    ],
  },
  {
    id: 'news',
    label: 'Tin tức',
    path: '/tintuc',
    children: [
      { title: 'Hoạt động SX - KD', href: '/tintuc/hoat-dong-sx-kd' },
      { title: 'Hoạt động đoàn thể', href: '/tintuc/hoat-dong-doan-the' },
      { title: 'Tin dầu khí', href: '/tintuc/tin-dau-khi' },
      { title: 'Thông cáo báo chí', href: '/tintuc/thong-cao-bao-chi' },
    ],
  },
  {
    id: 'fields',
    label: 'Lĩnh vực & Năng lực',
    path: '/linhvuc-nangluc',
    children: [],
  },
  {
    id: 'partners',
    label: 'Đối tác & Dự án',
    path: '/doitac-duan',
    children: [],
  },
  {
    id: 'development',
    label: 'Phát triển',
    path: '/phattrien',
    children: [],
  },
  {
    id: 'resources',
    label: 'Các nguồn chung',
    path: '/cacnguonchung',
    children: [],
  },
  {
    id: 'contact',
    label: 'Liên hệ',
    path: '/lienhe',
    children: [],
  },
];

export const SIDEBAR_NAVIGATION_ITEMS = [
  {
    id: 'news-categories',
    label: 'Danh mục tin tức',
    path: '/tintuc',
    children: [
      { title: 'Hoạt động SX - KD', href: '/tintuc/hoat-dong-sx-kd' },
      { title: 'Hoạt động đoàn thể', href: '/tintuc/hoat-dong-doan-the' },
      { title: 'Tin dầu khí', href: '/tintuc/tin-dau-khi' },
      { title: 'Thông cáo báo chí', href: '/tintuc/thong-cao-bao-chi' },
      { title: 'Thư viện ảnh/video', href: '/tintuc/thu-vien-anh-video' },
    ],
  },
];

