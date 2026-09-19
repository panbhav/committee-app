// Exact September data from the 4 sheets

export const INITIAL_MEMBERS = [
  { id: 1, name: "AVNISH", phone: "6378021059", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 2, name: "GAGAN", phone: "9800000002", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 3, name: "HARISH", phone: "9800000003", role: "admin", memberLimit: 200000, outerLimit: 800000 }, // Super Admin
  { id: 4, name: "MAHENDRA", phone: "9800000004", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 5, name: "MANOJ", phone: "9800000005", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 6, name: "MANSINGH", phone: "9800000006", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 7, name: "NARESH", phone: "9800000007", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 8, name: "NEERAJ", phone: "9800000008", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 9, name: "PRAHLAD", phone: "9800000009", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 10, name: "SATISH", phone: "9800000010", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 11, name: "SHAILENDRA", phone: "9800000011", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 12, name: "VIPIN", phone: "9800000012", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 13, name: "YASH", phone: "9800000013", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 14, name: "TARUN", phone: "9800000014", role: "member", memberLimit: 200000, outerLimit: 800000 },
  { id: 15, name: "NARENDRA", phone: "8219352124", role: "admin", memberLimit: 200000, outerLimit: 800000 }, // Super Admin
];

export const INITIAL_LOANS = [
  // SELF LOANS (10% Interest, 12 months)
  { id: 265, borrowerName: "AVNISH", borrowerPhone: "6378021059", guarantor: "AVNISH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 9, totalMonths: 12, securityFee: 0 },
  { id: 270, borrowerName: "AVNISH", borrowerPhone: "6378021059", guarantor: "AVNISH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 11, totalMonths: 12, securityFee: 0 },
  { id: 257, borrowerName: "GAGAN", borrowerPhone: "9800000002", guarantor: "GAGAN", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 5, totalMonths: 12, securityFee: 0 },
  { id: 269, borrowerName: "GAGAN", borrowerPhone: "9800000002", guarantor: "GAGAN", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 10, totalMonths: 12, securityFee: 0 },
  { id: 261, borrowerName: "HARISH", borrowerPhone: "9800000003", guarantor: "HARISH", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 8, totalMonths: 12, securityFee: 0 },
  { id: 249, borrowerName: "MAHENDRA", borrowerPhone: "9800000004", guarantor: "MAHENDRA", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 3, totalMonths: 12, securityFee: 0 },
  { id: 248, borrowerName: "MANOJ", borrowerPhone: "9800000005", guarantor: "MANOJ", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 3, totalMonths: 12, securityFee: 0 },
  { id: 271, borrowerName: "MANOJ", borrowerPhone: "9800000005", guarantor: "MANOJ", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 11, totalMonths: 12, securityFee: 0 },
  { id: 272, borrowerName: "MANOJ", borrowerPhone: "9800000005", guarantor: "MANOJ", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 12, totalMonths: 12, securityFee: 0 },
  { id: 260, borrowerName: "MANSINGH", borrowerPhone: "9800000006", guarantor: "MANSINGH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 7, totalMonths: 12, securityFee: 0 },
  { id: 244, borrowerName: "NARENDRA", borrowerPhone: "8219352124", guarantor: "NARENDRA", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 1, totalMonths: 12, securityFee: 0 },
  { id: 273, borrowerName: "NARENDRA", borrowerPhone: "8219352124", guarantor: "NARENDRA", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 12, totalMonths: 12, securityFee: 0 },
  { id: 250, borrowerName: "NARESH", borrowerPhone: "9800000007", guarantor: "NARESH", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 4, totalMonths: 12, securityFee: 0 },
  { id: 259, borrowerName: "NARESH", borrowerPhone: "9800000007", guarantor: "NARESH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 6, totalMonths: 12, securityFee: 0 },
  { id: 243, borrowerName: "NEERAJ", borrowerPhone: "9800000008", guarantor: "NEERAJ", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 1, totalMonths: 12, securityFee: 0 },
  { id: 247, borrowerName: "NEERAJ", borrowerPhone: "9800000008", guarantor: "NEERAJ", type: "self", principal: 15000, rate: 10, monthlyKisht: 1375, currentMonth: 2, totalMonths: 12, securityFee: 0 },
  { id: 258, borrowerName: "NEERAJ", borrowerPhone: "9800000008", guarantor: "NEERAJ", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 5, totalMonths: 12, securityFee: 0 },
  { id: 267, borrowerName: "NEERAJ", borrowerPhone: "9800000008", guarantor: "NEERAJ", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 9, totalMonths: 12, securityFee: 0 },
  { id: 256, borrowerName: "PRAHLAD", borrowerPhone: "9800000009", guarantor: "PRAHLAD", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 5, totalMonths: 12, securityFee: 0 },
  { id: 263, borrowerName: "PRAHLAD", borrowerPhone: "9800000009", guarantor: "PRAHLAD", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 8, totalMonths: 12, securityFee: 0 },
  { id: 268, borrowerName: "PRAHLAD", borrowerPhone: "9800000009", guarantor: "PRAHLAD", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 10, totalMonths: 12, securityFee: 0 },
  { id: 252, borrowerName: "SATISH", borrowerPhone: "9800000010", guarantor: "SATISH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 4, totalMonths: 12, securityFee: 0 },
  { id: 255, borrowerName: "SATISH", borrowerPhone: "9800000010", guarantor: "SATISH", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 5, totalMonths: 12, securityFee: 0 },
  { id: 251, borrowerName: "SHAILENDRA", borrowerPhone: "9800000011", guarantor: "SHAILENDRA", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 4, totalMonths: 12, securityFee: 0 },
  { id: 245, borrowerName: "TARUN", borrowerPhone: "9800000014", guarantor: "TARUN", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 1, totalMonths: 12, securityFee: 0 },
  { id: 246, borrowerName: "VIPIN", borrowerPhone: "9800000012", guarantor: "VIPIN", type: "self", principal: 50000, rate: 10, monthlyKisht: 4583, currentMonth: 2, totalMonths: 12, securityFee: 0 },
  { id: 254, borrowerName: "VIPIN", borrowerPhone: "9800000012", guarantor: "VIPIN", type: "self", principal: 72000, rate: 10, monthlyKisht: 6600, currentMonth: 5, totalMonths: 12, securityFee: 0 },
  { id: 266, borrowerName: "YASH", borrowerPhone: "9800000013", guarantor: "YASH", type: "self", principal: 100000, rate: 10, monthlyKisht: 9167, currentMonth: 9, totalMonths: 12, securityFee: 0 },

  // OUTER LOANS (16% Interest, 12 months)
  { id: 408, borrowerName: "SANJU SAINI", borrowerPhone: "9700000001", guarantor: "AVNISH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 3, totalMonths: 12, securityFee: 500 },
  
  // Harish Guaranteed
  { id: 403, borrowerName: "BHAGWATI SAINI", borrowerPhone: "9700000002", guarantor: "HARISH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 2, totalMonths: 12, securityFee: 250 },
  { id: 417, borrowerName: "GAURAV GUPTA", borrowerPhone: "9700000003", guarantor: "HARISH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 4, totalMonths: 12, securityFee: 250 },
  { id: 420, borrowerName: "PRADEEP", borrowerPhone: "9700000004", guarantor: "HARISH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 5, totalMonths: 12, securityFee: 250 },
  { id: 421, borrowerName: "MOHAN LAL", borrowerPhone: "9700000005", guarantor: "HARISH", type: "outer", principal: 45000, rate: 16, monthlyKisht: 4350, currentMonth: 1, totalMonths: 12, securityFee: 225 },
  { id: 426, borrowerName: "CHAMAN DEVI", borrowerPhone: "9700000006", guarantor: "HARISH", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 5, totalMonths: 12, securityFee: 150 },
  { id: 427, borrowerName: "YASH SAINI", borrowerPhone: "9700000007", guarantor: "HARISH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 6, totalMonths: 12, securityFee: 250 },
  { id: 432, borrowerName: "KAMAL MAHWAR", borrowerPhone: "9700000008", guarantor: "HARISH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 6, totalMonths: 12, securityFee: 250 },
  { id: 441, borrowerName: "NARENDRA", borrowerPhone: "9700000009", guarantor: "HARISH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 8, totalMonths: 12, securityFee: 500 },
  { id: 444, borrowerName: "POONAM SHARMA", borrowerPhone: "9700000010", guarantor: "HARISH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 9, totalMonths: 12, securityFee: 500 },
  { id: 445, borrowerName: "VIKRAM", borrowerPhone: "9700000011", guarantor: "HARISH", type: "outer", principal: 60000, rate: 16, monthlyKisht: 5800, currentMonth: 9, totalMonths: 12, securityFee: 300 },
  { id: 455, borrowerName: "SAGAR", borrowerPhone: "9700000012", guarantor: "HARISH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 11, totalMonths: 12, securityFee: 500 },
  { id: 457, borrowerName: "VIPUL SINGH", borrowerPhone: "9700000013", guarantor: "HARISH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 12, totalMonths: 12, securityFee: 500 },

  // Mahendra Guaranteed
  { id: 416, borrowerName: "MEENA SAINI", borrowerPhone: "9700000014", guarantor: "MAHENDRA", type: "outer", principal: 80000, rate: 16, monthlyKisht: 7733, currentMonth: 4, totalMonths: 12, securityFee: 400 },
  { id: 438, borrowerName: "HEMANT", borrowerPhone: "9700000015", guarantor: "MAHENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 8, totalMonths: 12, securityFee: 500 },
  { id: 448, borrowerName: "KAILASH", borrowerPhone: "9700000016", guarantor: "MAHENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 10, totalMonths: 12, securityFee: 500 },
  { id: 460, borrowerName: "PINIKI", borrowerPhone: "9700000017", guarantor: "MAHENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 12, totalMonths: 12, securityFee: 500 },

  // Manoj Guaranteed
  { id: 396, borrowerName: "SONU SHARMA", borrowerPhone: "9700000018", guarantor: "MANOJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 1, totalMonths: 12, securityFee: 250 },
  { id: 404, borrowerName: "ASHISH SHARMA", borrowerPhone: "9700000019", guarantor: "MANOJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 2, totalMonths: 12, securityFee: 250 },
  { id: 405, borrowerName: "DEVENDRA", borrowerPhone: "9700000020", guarantor: "MANOJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 2, totalMonths: 12, securityFee: 250 },
  { id: 406, borrowerName: "PAWAN GUPTA", borrowerPhone: "9700000021", guarantor: "MANOJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 2, totalMonths: 12, securityFee: 250 },
  { id: 415, borrowerName: "SUNIL", borrowerPhone: "9700000022", guarantor: "MANOJ", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 4, totalMonths: 12, securityFee: 150 },
  { id: 424, borrowerName: "SUNIL", borrowerPhone: "9700000023", guarantor: "MANOJ", type: "outer", principal: 20000, rate: 16, monthlyKisht: 1933, currentMonth: 5, totalMonths: 12, securityFee: 100 },
  { id: 425, borrowerName: "SONU", borrowerPhone: "9700000024", guarantor: "MANOJ", type: "outer", principal: 20000, rate: 16, monthlyKisht: 1933, currentMonth: 5, totalMonths: 12, securityFee: 100 },
  { id: 431, borrowerName: "PAWAN RAJPUT", borrowerPhone: "9700000025", guarantor: "MANOJ", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 6, totalMonths: 12, securityFee: 500 },
  { id: 439, borrowerName: "VANSH", borrowerPhone: "9700000026", guarantor: "MANOJ", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 8, totalMonths: 12, securityFee: 150 },
  { id: 456, borrowerName: "LAKSHIT", borrowerPhone: "9700000027", guarantor: "MANOJ", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 11, totalMonths: 12, securityFee: 500 },
  { id: 459, borrowerName: "MAHESH", borrowerPhone: "9700000028", guarantor: "MANOJ", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 12, totalMonths: 12, securityFee: 150 },

  // Narendra Guaranteed
  { id: 401, borrowerName: "HARISH", borrowerPhone: "9700000029", guarantor: "NARENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 2, totalMonths: 12, securityFee: 500 },
  { id: 402, borrowerName: "AVINAY SHARMA", borrowerPhone: "9700000030", guarantor: "NARENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 2, totalMonths: 12, securityFee: 500 },
  { id: 413, borrowerName: "RAVI", borrowerPhone: "9700000031", guarantor: "NARENDRA", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 4, totalMonths: 12, securityFee: 150 },
  { id: 414, borrowerName: "RAJAN TANWAR", borrowerPhone: "9700000032", guarantor: "NARENDRA", type: "outer", principal: 60000, rate: 16, monthlyKisht: 5800, currentMonth: 4, totalMonths: 12, securityFee: 300 },
  { id: 428, borrowerName: "MANJU MEENA", borrowerPhone: "9700000033", guarantor: "NARENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 6, totalMonths: 12, securityFee: 500 },
  { id: 429, borrowerName: "SUNIL KUAMR", borrowerPhone: "9700000034", guarantor: "NARENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 6, totalMonths: 12, securityFee: 500 },
  { id: 435, borrowerName: "VIJAY KUMAR", borrowerPhone: "9700000035", guarantor: "NARENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 7, totalMonths: 12, securityFee: 500 },
  { id: 449, borrowerName: "ROHITASH", borrowerPhone: "9700000036", guarantor: "NARENDRA", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 10, totalMonths: 12, securityFee: 250 },
  { id: 454, borrowerName: "SUNIL", borrowerPhone: "9700000037", guarantor: "NARENDRA", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 11, totalMonths: 12, securityFee: 150 },

  // Naresh Guaranteed
  { id: 398, borrowerName: "POOJA SAINI", borrowerPhone: "9700000038", guarantor: "NARESH", type: "outer", principal: 40000, rate: 16, monthlyKisht: 3867, currentMonth: 1, totalMonths: 12, securityFee: 200 },
  { id: 407, borrowerName: "ROHIT", borrowerPhone: "9700000039", guarantor: "NARESH", type: "outer", principal: 25000, rate: 16, monthlyKisht: 2417, currentMonth: 2, totalMonths: 12, securityFee: 125 },
  { id: 410, borrowerName: "VIJAY SHARMA", borrowerPhone: "9700000040", guarantor: "NARESH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 3, totalMonths: 12, securityFee: 250 },
  { id: 412, borrowerName: "ANUPAM", borrowerPhone: "9700000041", guarantor: "NARESH", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 4, totalMonths: 12, securityFee: 500 },
  { id: 436, borrowerName: "VIJAY KUMAR SHARMA", borrowerPhone: "9700000042", guarantor: "NARESH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 7, totalMonths: 12, securityFee: 250 },
  { id: 450, borrowerName: "ABHISHEK", borrowerPhone: "9700000043", guarantor: "NARESH", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 10, totalMonths: 12, securityFee: 250 },

  // Neeraj Guaranteed
  { id: 423, borrowerName: "MADHUR", borrowerPhone: "9700000044", guarantor: "NEERAJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 5, totalMonths: 12, securityFee: 250 },
  { id: 434, borrowerName: "MADHUR", borrowerPhone: "9700000045", guarantor: "NEERAJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 7, totalMonths: 12, securityFee: 250 },
  { id: 452, borrowerName: "NIMMY", borrowerPhone: "9700000046", guarantor: "NEERAJ", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 10, totalMonths: 12, securityFee: 250 },

  // Prahlad Guaranteed
  { id: 411, borrowerName: "NITIN", borrowerPhone: "9700000047", guarantor: "PRAHLAD", type: "outer", principal: 30000, rate: 16, monthlyKisht: 2900, currentMonth: 3, totalMonths: 12, securityFee: 150 },
  { id: 433, borrowerName: "NITIN", borrowerPhone: "9700000048", guarantor: "PRAHLAD", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 7, totalMonths: 12, securityFee: 250 },
  { id: 442, borrowerName: "MAHENDRA", borrowerPhone: "9700000049", guarantor: "PRAHLAD", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 8, totalMonths: 12, securityFee: 500 },
  { id: 443, borrowerName: "ASHOK", borrowerPhone: "9700000050", guarantor: "PRAHLAD", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 9, totalMonths: 12, securityFee: 500 },
  { id: 458, borrowerName: "LAXMINARYAN", borrowerPhone: "9700000051", guarantor: "PRAHLAD", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 12, totalMonths: 12, securityFee: 250 },

  // Shailendra Guaranteed
  { id: 418, borrowerName: "POORAN SHARMA", borrowerPhone: "9700000052", guarantor: "SHAILENDRA", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 4, totalMonths: 12, securityFee: 250 },
  { id: 430, borrowerName: "RAJU KUMAWAT", borrowerPhone: "9700000053", guarantor: "SHAILENDRA", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 6, totalMonths: 12, securityFee: 250 },
  { id: 437, borrowerName: "LAXMAN", borrowerPhone: "9700000054", guarantor: "SHAILENDRA", type: "outer", principal: 50000, rate: 16, monthlyKisht: 4833, currentMonth: 8, totalMonths: 12, securityFee: 250 },
  { id: 440, borrowerName: "MOHIT", borrowerPhone: "9700000055", guarantor: "SHAILENDRA", type: "outer", principal: 60000, rate: 16, monthlyKisht: 5800, currentMonth: 8, totalMonths: 12, securityFee: 300 },
  { id: 447, borrowerName: "ANITA DEVI", borrowerPhone: "9700000056", guarantor: "SHAILENDRA", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 10, totalMonths: 12, securityFee: 500 },

  // Vipin Guaranteed
  { id: 422, borrowerName: "MAYANK", borrowerPhone: "9700000057", guarantor: "VIPIN", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 5, totalMonths: 12, securityFee: 500 },
  { id: 446, borrowerName: "VISHAL", borrowerPhone: "9700000058", guarantor: "VIPIN", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 9, totalMonths: 12, securityFee: 500 },
  { id: 451, borrowerName: "KAPIL", borrowerPhone: "9700000059", guarantor: "VIPIN", type: "outer", principal: 100000, rate: 16, monthlyKisht: 9667, currentMonth: 10, totalMonths: 12, securityFee: 500 },
];
