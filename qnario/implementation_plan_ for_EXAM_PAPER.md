# Implement Teacher Exam Creation Updates

## Overview
Revamp the [teacher-create-exam.html](file:///e:/CHECKING_1/qnario/teacher-create-exam.html) to support a section-based exam generation flow. The teacher will generate questions section by section (A, B, C...) with specific structures and marks. Selected questions from each generation pass move into a single "Question Paper" container, where a final curation step (+/- boxes) occurs before saving. The saved papers will be stored and viewable in a new `teacher-Exam-paper.html` page, accessible from [teacher-papers.html](file:///e:/CHECKING_1/qnario/teacher-papers.html).

## Proposed Changes

### [teacher-create-exam.html](file:///e:/CHECKING_1/qnario/teacher-create-exam.html)
- **Form Updates**: Remove "Question Format", "Difficulty", and "Number of Questions". Add "Specific Topics" (optional).
- **New Section - Paper Pattern**:
  - Add elements: Section name (A, B, C...), Question Structure (dropdown), Marks (dropdown 1M-5M), Number of Questions (input).
  - Add "Generate" button below this.
- **Generation & Selection Box**:
  - Show generated questions with standard checkboxes and "Select All" at the top.
  - Add a "Done" button at the bottom.
- **New Section - Question Paper**:
  - Container that holds the final paper state.
  - Populated when "Done" is clicked in the generation phase.
  - Sections are visually distinct, listing Section Name and Marks.
  - Questions have a custom selection box (blank initially, hover shows `+`, click makes it `+`, hover selected shows `-`, click deselected makes it blank).
  - Show buttons: "Move to Section-[Next]" and "Save Paper".
  - "Save Paper" compiles the final selected questions and saves to `localStorage` under a `teacherPapers` array.

### [teacher-papers.html](file:///e:/CHECKING_1/qnario/teacher-papers.html)
- Update the "Exam paper Set's" anchor link to point to `teacher-Exam-paper.html`.

### `teacher-Exam-paper.html` [NEW]
- Create this new page based on [teacher-papers.html](file:///e:/CHECKING_1/qnario/teacher-papers.html) styling.
- Read `teacherPapers` from `localStorage`.
- Display a list/table of saved papers showing Subject, Date & Time, and Sections used.
- Add actions: Preview, Delete, Download.

## Verification
- Test generating questions for Section A, selecting a few, and checking if they appear correctly in the Question Paper container.
- Test the custom +/- checkbox logic.
- Test "Move to Section-B" locks Section A and allows generating Section B.
- Test "Save Paper" to ensure it stores the correct payload.
- Verify `teacher-Exam-paper.html` correctly displays the saved paper.
