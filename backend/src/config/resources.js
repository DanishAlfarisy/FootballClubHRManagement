export const resources = {
  people: { table: 'persons', search: ['full_name', 'email'], order: 'full_name', readOnly: true },
  positions: { table: 'positions', search: ['code', 'position_name'], order: 'code' },
  departments: { table: 'departments', search: ['department_name'], order: 'department_name' },
  events: { table: 'events', search: ['title', 'description', 'location'], order: 'event_date' },
  achievements: { table: 'achievements', search: ['title', 'description'], order: 'achievement_date' },
  'event-categories': { table: 'event_categories', search: ['category_name'], order: 'category_name' },
  'document-categories': { table: 'document_categories', search: ['category_name'], order: 'category_name' },
}