import { HttpError } from '../../http/errors/http-error.js';
import { getPublicCustomerProfile, listPublicCustomers } from './customers.repository.js';

export const getPublicCustomers = async (query: { search?: string }) => ({
  customers: await listPublicCustomers(query),
});

export const getCustomerProfileById = async (id: string) => {
  const profile = await getPublicCustomerProfile(id);

  if (!profile) {
    throw new HttpError(404, 'Публичный профиль заказчика не найден');
  }

  return profile;
};
