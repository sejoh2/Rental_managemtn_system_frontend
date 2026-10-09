function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Builds a CSV from rows already loaded in the page and saves it as a file.
export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','))
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
