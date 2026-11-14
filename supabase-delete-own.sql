-- Lets an expert permanently delete a CV they created (admin can delete any).
create or replace function portal_cv_delete_own(p_token text,p_code text) returns boolean
language plpgsql security definer set search_path=public, extensions as $$
declare u portal_users; c portal_cvs;
begin
  u:=portal_auth(p_token);
  select * into c from portal_cvs where code=p_code;
  if c.code is null then return true; end if;
  if u.role<>'admin' and c.created_by<>u.username then
    raise exception 'Only the expert who created this CV or the admin can delete it.';
  end if;
  delete from portal_cvs where code=p_code;
  insert into portal_activity(code,username,action,detail)
  values(p_code,u.username,'deleted',coalesce(nullif(c.customer,''),'(no name)')||' · No. '||lpad(coalesce(c.serial,0)::text,5,'0'));
  return true;
end $$;
grant execute on function portal_cv_delete_own(text,text) to anon;
