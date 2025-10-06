import React, { useEffect, useState } from 'react';
import { Loader } from '../components/Loader';
import { Person } from '../types';
import { getPeople } from '../api';
import { PeopleTable } from '../components/PeopleTable';
import { PeopleFilters } from '../components/PeopleFilters';
import { useSearchParams } from 'react-router-dom';

type Error =
  | 'Something went wrong'
  | 'There are no people on the server'
  | 'none';

export type Sex = 'f' | 'm' | 'all';

export const PeoplePage: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [visiblePeople, setVisiblePeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>('none');

  const [selectedCenturies, setSelectedCenturies] = useState<number[]>([]);
  const [sortBySex, setSortBySex] = useState<Sex>('all');
  const [sortByQuery, setSortByQuery] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setLoading(true);
    setError('none');

    getPeople()
      .then(fetchedPeople => {
        if (!fetchedPeople.length) {
          setError('There are no people on the server');
        } else {
          setPeople(fetchedPeople);
          setVisiblePeople(fetchedPeople);
        }
      })
      .catch(() => setError('Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (sortBySex !== 'all') {
      params.set('sex', sortBySex);
    }

    if (sortByQuery.trim()) {
      params.set('query', sortByQuery.trim());
    }

    if (selectedCenturies.length > 0) {
      selectedCenturies.forEach(c => params.append('centuries', String(c)));
    }

    setSearchParams(params);
  }, [sortBySex, sortByQuery, selectedCenturies, setSearchParams]);

  useEffect(() => {
    const sexParam = searchParams.get('sex') as Sex | null;
    const queryParam = searchParams.get('query');
    const centuriesParam = searchParams.getAll('centuries').map(Number);

    if (sexParam && ['f', 'm', 'all'].includes(sexParam)) {
      setSortBySex(sexParam);
    }

    if (queryParam) {
      setSortByQuery(queryParam);
    }

    if (centuriesParam.length > 0) {
      setSelectedCenturies(centuriesParam);
    }
  }, []);

  useEffect(() => {
    let filtered = [...people];

    if (sortBySex !== 'all') {
      filtered = filtered.filter(p => p.sex === sortBySex);
    }

    if (selectedCenturies.length > 0) {
      filtered = filtered.filter(p => {
        const birthCentury = Math.ceil(p.born / 100);

        return selectedCenturies.includes(birthCentury);
      });
    }

    if (sortByQuery.trim() !== '') {
      const q = sortByQuery.trim().toLowerCase();

      filtered = filtered.filter(p =>
        [p.name, p.motherName, p.fatherName]
          .filter(Boolean)
          .some(field => field!.toLowerCase().includes(q)),
      );
    }

    setVisiblePeople(filtered);
  }, [people, sortBySex, selectedCenturies, sortByQuery]);

  return (
    <>
      <h1 className="title">People Page</h1>

      {loading && <Loader />}

      {error === 'Something went wrong' && (
        <p data-cy="peopleLoadingError" className="has-text-danger">
          {error}
        </p>
      )}

      {error === 'There are no people on the server' && (
        <p data-cy="noPeopleMessage">{error}</p>
      )}

      {!loading && error === 'none' && (
        <div className="columns">
          <div className="column is-two-thirds">
            {visiblePeople.length > 0 ? (
              <PeopleTable people={visiblePeople} />
            ) : (
              <p className="column is-two-thirds">
                There are no people matching the current filters
              </p>
            )}
          </div>

          <div className="column">
            <PeopleFilters
              selectedCenturies={selectedCenturies}
              setSelectedCenturies={setSelectedCenturies}
              sortBySex={sortBySex}
              setSortBySex={setSortBySex}
              sortByQuery={sortByQuery}
              setSortByQuery={setSortByQuery}
            />
          </div>
        </div>
      )}
    </>
  );
};
