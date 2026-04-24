const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4200/api';

export type HealthStatus = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: number;
};

export const getHealth = async () => {
  const response = await fetch(`${apiUrl}/health`);

  if (!response.ok) {
    throw new Error('Fastik API is unavailable');
  }

  return response.json() as Promise<HealthStatus>;
};
