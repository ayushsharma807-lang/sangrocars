insert into public.lead_manager_leads
  (full_name, phone, city, budget, interested_car, source, cash_or_finance, status, notes, next_follow_up_date, assigned_to)
values
  ('Rahul Sharma', '9876543210', 'Jalandhar', '₹10-15 Lakh', 'Innova Crysta', 'Instagram', 'Finance', 'new', 'Asked about EMIs and paperwork.', current_date + interval '2 day', 'Ayush'),
  ('Simran Kaur', '9012345678', 'Ludhiana', '₹6-8 Lakh', 'Swift / Baleno', 'WhatsApp', 'Cash', 'follow_up', 'Wants automatic if possible.', current_date + interval '1 day', 'Neha'),
  ('Amit Verma', '9811122233', 'Amritsar', '₹20-25 Lakh', 'Fortuner', 'Facebook', 'Finance', 'visit_scheduled', 'Visit scheduled for Saturday.', current_date + interval '3 day', 'Ayush'),
  ('Harpreet Singh', '9988776655', 'Patiala', '₹4-6 Lakh', 'WagonR', 'Call', 'Cash', 'closed', 'Purchased from dealer inventory.', current_date - interval '7 day', 'Ayush');
