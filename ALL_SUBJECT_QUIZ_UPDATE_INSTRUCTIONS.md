# Talha LMS — all-subject quiz update

This package expands the reviewed quiz bank from 5 Mathematics topics to 20
topics and 160 questions. It adds five priority topic quizzes each for
Chemistry, Pakistan Studies and Islamiyat while preserving the five existing
Mathematics sets.

## Covered topics

- Chemistry: ions and ionic bonds; formulae and balanced equations; the mole
  and Avogadro constant; rate of reaction and collision theory; preparation of
  salts.
- Mathematics: types of number; fractions, decimals and percentages; limits
  of accuracy and bounds; ratio and proportion; percentages.
- Pakistan Studies: War of Independence 1857–58; Sir Syed Ahmad Khan and the
  Aligarh Movement; Khilafat Movement; attempts to solve subcontinent problems
  1940–47; agricultural development.
- Islamiyat: revelation of the Qur'an; compilation of the Qur'an; Hijra and the
  Madinan community; isnad, matn and reliability; Caliph Abu Bakr.

## Upload to GitHub

1. Extract the ZIP on the computer.
2. Open the private `REHMANMAZHAR/LMS` repository and stay on `main`.
3. Upload the folders from the ZIP. When GitHub says a file already exists,
   open that file, choose **Edit**, replace its contents with the matching file
   from this package, and commit the change.
4. Keep every path exactly as shown. In particular, the three quiz files remain
   inside `app`, and the validator remains inside `scripts`.
5. Commit with the message `Add reviewed quizzes for all subjects`.
6. Wait for the Cloudflare build linked to that commit to succeed, then refresh
   the permanent LMS address with `Ctrl + Shift + R`.

## Important

- No D1 migration or SQL command is needed for this update.
- Do not change `wrangler.jsonc`.
- Do not recreate `FAMILY_ACCESS_CODE` or `SESSION_SIGNING_SECRET`.
- Existing quiz attempts and progress remain in D1.
- A quiz requires the topic to be at **Learning** or above before it starts.
- Passing marks are 85% for Mathematics and Chemistry, and 80% for Pakistan
  Studies and Islamiyat. **Secure** still requires two passing attempts on
  different dates, with at least one timed attempt.

## Quick verification

After deployment, open **Quizzes**. The topic menu should show four subject
groups with five quizzes each. Test one new topic by marking it **Learning** in
the Syllabus, completing the eight questions and confirming that the score,
corrections and recent evidence appear.

These automatic quizzes check core knowledge and application. Continue using
**Tests** for full Mathematics working, Chemistry structured/practical tasks,
Pakistan Studies source and judgement answers, and Islamiyat 10+4 responses.

## Syllabus review basis

The new topic scope was checked against Cambridge's official examination
syllabuses for Talha's 2027 session:

- Chemistry 0620, 2026–2028:
  https://www.cambridgeinternational.org/Images/697205-2026-2028-syllabus.pdf
- Pakistan Studies 0448, 2027:
  https://www.cambridgeinternational.org/Images/732847-2027-syllabus.pdf
- Islamiyat 0493, 2026–2027:
  https://www.cambridgeinternational.org/Images/697174-2026-2027-syllabus.pdf

The questions are original checks written for this private LMS; they are not
copied past-paper questions.
