import { useEffect, useState } from 'react';

export type Person = { id: string; name: string; firstName: string };

/** Active admins and directors, for "who" pickers. */
export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    fetch('/api/users/options')
      .then((response) => (response.ok ? response.json() : []))
      .then(setPeople)
      .catch(() => setPeople([]));
  }, []);

  return people;
}
