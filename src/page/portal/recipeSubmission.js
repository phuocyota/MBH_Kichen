// Retain a successfully saved draft if submitting it fails. Retrying unchanged
// content must submit that draft, rather than create another recipe version.
export function createRecipeSubmission(api) {
  let saved;
  return async (body, action) => {
    const signature = JSON.stringify(body);
    if (saved?.signature !== signature) {
      const recipe = await api.create('/kitchen/recipes', body);
      saved = { signature, recipe, submitted: false };
    }
    if (action === 'submit' && !saved.submitted) {
      try {
        await api.action('/kitchen/recipes', saved.recipe.id, 'submit', {});
        saved.submitted = true;
      } catch (error) {
        throw new Error(`Đã lưu bản nháp nhưng chưa gửi duyệt: ${error.message}`);
      }
    }
    return saved.recipe;
  };
}
