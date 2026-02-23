import Fuse from "fuse.js";

export type SearchableStudent = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  classId: string;
  className: string;
  classColor: string;
};

export function createStudentSearcher(students: SearchableStudent[]) {
  return new Fuse(students, {
    keys: [
      { name: "lastName", weight: 0.6 },
      { name: "firstName", weight: 0.4 },
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
  });
}

export function searchStudents(
  searcher: Fuse<SearchableStudent>,
  query: string,
  limit: number = 10
): SearchableStudent[] {
  if (!query.trim()) return [];
  const results = searcher.search(query, { limit });
  return results.map((r) => r.item);
}
