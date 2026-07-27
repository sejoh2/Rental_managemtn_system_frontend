export const smsStats = [
  { label: 'Sent this month', value: '1,204', note: 'KES 1,806 cost', tone: 'muted' },
  { label: 'Delivered', value: '98.4%', note: '1,185 messages', tone: 'success' },
  { label: 'Failed', value: '19', note: 'retry queued', tone: 'danger' },
  { label: 'Scheduled', value: '3', note: 'next: rent reminder, 1 Aug', tone: 'muted' },
]

export const smsMessages = [
  { tenant: 'John Otieno', template: 'Balance reminder', sent: '3 Jul, 8:00 AM', status: 'Delivered', tone: 'success' },
  { tenant: 'Faith Njeri', template: 'Payment confirmation', sent: '2 Jul, 9:03 AM', status: 'Delivered', tone: 'success' },
  { tenant: 'Samuel Kiplagat', template: 'Late payment warning', sent: '1 Jul, 8:00 AM', status: 'Failed', tone: 'danger' },
]

export const smsTemplates = [
  {
    title: 'Balance reminder',
    body: '"Dear {name}, your rent balance for {house} is KES {balance}. Kindly pay before {due_date}."',
  },
  {
    title: 'Payment confirmation',
    body: '"Payment of KES {amount} received. Your rent for {month} is fully paid. Thank you."',
  },
]