insert into members (
  full_name, email, linkedin_url, headline, role, company, location, about,
  skills, can_help_with, looking_for, languages,
  open_to_mentor, open_to_opportunities, open_to_collaborate, open_to_speaking,
  visibility_status, consent_given, onboarding_completed
) values
('Amina Hassan', 'amina.hassan@example.test', 'https://www.linkedin.com/in/amina-hassan-demo', 'Data platforms for public impact and calmer decisions', 'Data Engineer', 'Northstar Analytics', 'Amsterdam', 'Fake seed profile for local development.',
 array['Azure','Power BI','Data Engineering'], array['Data pipelines','Power BI models'], array['Community projects'], array['Dutch','English','Arabic'], true, false, true, true, 'approved', true, true),
('Samer Al-Khalid', 'samer.alkhalid@example.test', 'https://www.linkedin.com/in/samer-demo', 'Cloud consultant helping teams modernize without chaos', 'Cloud Consultant', 'Canal Cloud', 'Rotterdam', 'Fake seed profile for local development.',
 array['Azure','Cloud Architecture','Microsoft 365'], array['Cloud assessments','Landing zones'], array['Azure specialists'], array['Dutch','English','Arabic'], true, true, true, true, 'approved', true, true),
('Hidden Pending Demo', 'pending@example.test', null, 'This record should never appear publicly', 'Frontend Developer', 'Hidden', 'Amsterdam', 'Privacy-rule test record.',
 array['React'], array['Testing'], array['Approval'], array['English'], false, false, false, false, 'pending', true, false)
on conflict (email) do nothing;
