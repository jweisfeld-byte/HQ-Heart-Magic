-- Heart Magic HQ — Tasks-for-events
-- Lets a task be tied to a specific event (nullable, same pattern as
-- task.project_id) so the Events tab can show "what needs to happen
-- for this event" below the calendar (Jacob's ask).

alter table task
  add column if not exists event_id uuid references event(id) on delete set null;

create index if not exists task_event_idx on task(event_id);
