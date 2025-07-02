export async function submitManualPayment(data: any, mode: 'POST' | 'PUT' | 'DELETE' = 'POST') {
  const res = await fetch('/api/manual-payment', {
    method: mode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Failed to ${mode.toLowerCase()} manual payment`);

  return res.json();
}