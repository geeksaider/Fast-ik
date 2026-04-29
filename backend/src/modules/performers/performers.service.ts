import { HttpError } from '../../http/errors/http-error.js';
import { recalculatePerformerProgress } from '../levels/levels.service.js';
import { getPublicPerformerProfile } from './performers.repository.js';

export const getPerformerProfileById = async (id: string) => {
  const firstRead = await getPublicPerformerProfile(id);

  if (!firstRead) {
    throw new HttpError(404, 'Публичный профиль исполнителя не найден');
  }

  await recalculatePerformerProgress(id);

  const updated = await getPublicPerformerProfile(id);

  if (!updated) {
    throw new HttpError(404, 'Публичный профиль исполнителя не найден');
  }

  return updated;
};
