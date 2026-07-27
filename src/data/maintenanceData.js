export const maintenanceTabs = [
  { label: 'All', count: 14, active: true },
  { label: 'Reported', count: 2 },
  { label: 'In progress', count: 3 },
  { label: 'Resolved', count: 9 },
]

export const maintenanceItems = [
  {
    title: 'Water leakage - House A7',
    subtitle: 'Riverside Court · reported by caretaker Peter Mwangi · 2 hrs ago',
    status: 'Reported',
    tone: 'danger',
  },
  {
    title: 'Broken window - House H03',
    subtitle: 'Green View · assigned to Kamau Repairs · est. KES 3,500',
    status: 'In progress',
    tone: 'warning',
  },
  {
    title: 'Blocked drainage - Compound',
    subtitle: 'Sunrise Bedsitters · assigned to caretaker · started yesterday',
    status: 'In progress',
    tone: 'warning',
  },
  {
    title: 'Gate lock repair',
    subtitle: 'Green View · resolved 3 days ago · KES 1,200',
    status: 'Resolved',
    tone: 'success',
  },
]