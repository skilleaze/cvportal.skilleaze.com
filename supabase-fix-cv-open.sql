-- Fix: "more than one row returned by a subquery" when opening a CV.
-- Looks up by exact CV code first; only uses the serial number when the search is a number.
create or replace function portal_cv_get(p_token text, p_code text) returns json
language plpgsql security definer set search_path=public, extensions as $$
declare r json; q text:=trim(coalesce(p_code,'')); begin perform portal_auth(p_token);
  select row_to_json(c) into r from portal_cvs c where lower(c.code)=lower(q) order by c.updated_at desc limit 1;
  if r is null and q ~ '^[#A-Za-z\-]*0*[0-9]+$' then
    select row_to_json(c) into r from portal_cvs c where c.serial::text=ltrim(regexp_replace(q,'[^0-9]','','g'),'0') order by c.updated_at desc limit 1;
  end if;
  return r; end $$;
grant execute on function portal_cv_get(text,text) to anon;
