export function pendingRecipeRequests(data) {
  return (Array.isArray(data) ? data : []).filter((row) =>
    ['OPEN', 'DRAFTED', 'REVISION_REQUESTED', 'SUBMITTED'].includes(row.status),
  )
}
