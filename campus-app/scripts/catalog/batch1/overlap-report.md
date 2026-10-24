# Batch 1 overlap report — 2026-10-24

Read-only observations, not an import result. University IDs and all existing
faculty names were read from the public GET at
https://lotus-campus.pages.dev/api/onboarding. All 65 existing course rows were
scanned in Supabase Table Editor (`public.courses`), using faculty IDs to restrict
the comparison to the five universities. No SQL was executed. Similarity below
is a manual spelling/title review within each university, not a merge decision.

| University | Existing ID | Existing faculties | Existing course names | Similarity to Batch 1 |
| --- | --- | --- | --- | --- |
| Bakı Dövlət Universiteti | 2 | Tətbiqi riyaziyyat və kibernetika fakültəsi | Əməliyyatlar tədqiqi və oyunlar nəzəriyyəsi; Ehtimal nəzəriyyəsi və riyazi statistika; Riyazi modelləşdirmə | No close faculty/course spelling matches to the journalism batch. |
| Azərbaycan Dövlət İqtisad Universiteti | 3 | Faculty not specified | İqtisadiyyata giriş; Mikroiqtisadiyyat; Makroiqtisadiyyat | No close spelling matches to the named faculties or six finance courses. Related subject area alone is not treated as a duplicate. |
| Azərbaycan Dövlət Neft və Sənaye Universiteti | 4 | Faculty not specified | Calculus 2 | `Calculus 2` resembles batch `Calculus I`, but the numbers/levels differ; do not merge. No matching faculty name. |
| Azərbaycan Dövlət Pedaqoji Universiteti | 14 | Tarix və Coğrafiya Fakültəsi | Fəlsəfə; Məntiq; Sosiologiya | Existing `Tarix və Coğrafiya Fakültəsi` resembles the originally approved `Tarix və coğrafiya` row (case/suffix differences). The owner-approved revision excludes that batch row and leaves the existing faculty unchanged. All six ADPU courses remain under `Filologiya`. No close course spelling matches. |
| Azərbaycan Texniki Universiteti | 25 | None | None | Exact approved university name and ID confirmed. Six faculty candidates, zero course candidates. |

No exact faculty names or exact course names in this batch already occur within
these universities. After the owner-approved exclusion, expected new candidates are 27 faculties
and 30 courses; SQL guards still decide what is absent at execution time.
No existing rows were merged, deleted, or changed.
