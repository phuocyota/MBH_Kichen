import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeSubmission } from '../src/page/portal/recipeSubmission.js';

test('saving a draft does not submit it', async () => {
  let submits = 0;
  const save = createRecipeSubmission({
    create: async () => ({ id: 'draft' }),
    action: async () => { submits++; },
  });
  assert.equal((await save({ productId: 'bread' }, 'draft')).id, 'draft');
  assert.equal(submits, 0);
});

test('send for review creates a draft then submits its exact ID', async () => {
  const calls = [];
  const body = { productId: 'bread', items: [{ quantity: 60 }] };
  const save = createRecipeSubmission({
    create: async (path, dto) => { calls.push([path, dto]); return { id: 'new-draft' }; },
    action: async (...args) => { calls.push(args); },
  });
  await save(body, 'submit');
  assert.deepEqual(calls, [
    ['/kitchen/recipes', body],
    ['/kitchen/recipes', 'new-draft', 'submit', {}],
  ]);
});

test('failed submission preserves draft for retry or saving as draft, without duplicate versions', async () => {
  let creates = 0, submits = 0;
  const save = createRecipeSubmission({
    create: async () => ({ id: `draft-${++creates}` }),
    action: async () => { if (++submits === 1) throw Error('Thiếu giá vốn'); },
  });
  const body = { productId: 'bread' };
  await assert.rejects(save(body, 'submit'), /Đã lưu bản nháp.*Thiếu giá vốn/);
  await save(body, 'draft');
  assert.equal(submits, 1);
  await save(body, 'submit');
  await save(body, 'submit');
  assert.equal(creates, 1);
  assert.equal(submits, 2);
});

test('modified contents get a new draft and a failed save never submits', async () => {
  let creates = 0, submits = 0;
  const save = createRecipeSubmission({
    create: async () => {
      if (++creates === 3) throw Error('Không lưu được');
      return { id: `draft-${creates}` };
    },
    action: async () => { submits++; },
  });
  await save({ quantity: 1 }, 'draft');
  assert.equal((await save({ quantity: 2 }, 'submit')).id, 'draft-2');
  await assert.rejects(save({ quantity: 3 }, 'submit'), /Không lưu được/);
  assert.equal(submits, 1);
});
