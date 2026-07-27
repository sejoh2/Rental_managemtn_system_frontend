export const unitFilters = [
  { label: 'All', count: 64 },
  { label: 'Occupied', count: 61 },
  { label: 'Vacant', count: 2 },
  { label: 'Under maintenance', count: 1 },
  { label: 'In arrears', count: 7 },
]

export const unitsByProperty = {
  'Green View Apartments': [
    {
      number: 'H01',
      type: 'One bedroom',
      floor: 'Floor 1',
      rent: 'KES 15,000',
      status: 'occupied',
    },
    {
      number: 'H02',
      type: 'One bedroom',
      floor: 'Floor 1',
      rent: 'KES 15,000',
      status: 'occupied',
    },
    {
      number: 'H03',
      type: 'Bedsitter',
      floor: 'Floor 1',
      rent: 'KES 9,000',
      status: 'arrears',
    },
    {
      number: 'H04',
      type: 'Vacant',
      floor: 'Floor 1',
      rent: 'KES 9,500',
      status: 'vacant',
    },
    {
      number: 'H11',
      type: 'Two bedroom',
      floor: 'Floor 2',
      rent: 'KES 22,000',
      status: 'occupied',
    },
    {
      number: 'H12',
      type: 'Two bedroom',
      floor: 'Floor 2',
      rent: 'KES 22,000',
      status: 'occupied',
    },
    {
      number: 'H13',
      type: 'One bedroom',
      floor: 'Floor 2',
      rent: 'KES 15,000',
      status: 'maintenance',
    },
    {
      number: 'H14',
      type: 'One bedroom',
      floor: 'Floor 2',
      rent: 'KES 15,000',
      status: 'occupied',
    },
  ],

  'Sunrise Bedsitters': [
    {
      number: 'B1',
      type: 'Bedsitter',
      floor: 'Floor 1',
      rent: 'KES 9,000',
      status: 'occupied',
    },
    {
      number: 'B2',
      type: 'Bedsitter',
      floor: 'Floor 1',
      rent: 'KES 9,000',
      status: 'arrears',
    },
    {
      number: 'B3',
      type: 'Bedsitter',
      floor: 'Floor 1',
      rent: 'KES 9,000',
      status: 'occupied',
    },
    {
      number: 'B4',
      type: 'Vacant',
      floor: 'Floor 1',
      rent: 'KES 9,000',
      status: 'vacant',
    },
  ],

  'Riverside Court': [
    {
      number: 'A1',
      type: 'Two bedroom',
      floor: 'Floor 1',
      rent: 'KES 18,000',
      status: 'occupied',
    },
    {
      number: 'A2',
      type: 'Two bedroom',
      floor: 'Floor 1',
      rent: 'KES 18,000',
      status: 'occupied',
    },
    {
      number: 'A7',
      type: 'Two bedroom',
      floor: 'Floor 2',
      rent: 'KES 18,000',
      status: 'arrears',
    },
  ],
}

export const unitStatusColors = {
  occupied: 'bg-[#2E7D4F]',
  arrears: 'bg-[#B3261E]',
  vacant: 'bg-[#A39B8D]',
  maintenance: 'bg-[#B8790E]',
}

export const unitLegend = [
  { label: 'Occupied', color: 'bg-[#2E7D4F]' },
  { label: 'In arrears', color: 'bg-[#B3261E]' },
  { label: 'Vacant', color: 'bg-[#A39B8D]' },
  { label: 'Under maintenance', color: 'bg-[#B8790E]' },
]