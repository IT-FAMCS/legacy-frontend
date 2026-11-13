import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmTelegramLink, getTelegramLink, issueTelegramLink, unlinkTelegram, type TelegramChallenge, type TelegramLinkState } from '../api/telegram';
import './telegram-link.css';

type Props = { state: TelegramLinkState; busy: boolean; error: string; url?: string; onIssue: () => void; onConfirm: () => void; onUnlink: () => void };
export function TelegramLinkContent({ state, busy, error, url, onIssue, onConfirm, onUnlink }: Props) {
  return <section className="telegram-link" aria-label="Привязка Telegram">
    <div className="telegram-link-heading"><span className="telegram-link-icon" aria-hidden="true">↗</span><div><h3>Telegram-бот</h3><p>Таски, напоминания и оборудка прямо в чате.</p></div></div>
    {!state.enabled && !state.binding && !state.pending ? <p className="telegram-link-muted">Интеграция Telegram ещё не настроена на сервере.</p> : state.binding ? <>
      <strong className="telegram-link-connected">Telegram подключён</strong>
      <p>{state.binding.display_name || 'Аккаунт Telegram'}{state.binding.username && ` · @${state.binding.username}`}</p>
      <p className="telegram-link-muted">ID: {state.binding.telegram_user_id}. Уведомления приходят в личный чат с ботом.</p>
      <button type="button" className="telegram-link-button" disabled={busy} onClick={onUnlink}>Отключить Telegram</button>
    </> : state.pending?.telegram_user_id ? <>
      <p>Бот получил запрос от:</p><div className="telegram-pending-identity"><strong>{state.pending.display_name || 'Аккаунт Telegram'}</strong>
        {state.pending.username && <span>@{state.pending.username}</span>}<span>ID: {state.pending.telegram_user_id}</span></div>
      <p className="telegram-link-muted">Подтвердите, что это ваш Telegram. До подтверждения бот не получит доступ к аккаунту.</p>
      <div className="telegram-link-actions"><button type="button" className="telegram-link-button telegram-link-primary" disabled={busy} onClick={onConfirm}>Подтвердить этот Telegram</button>
        <button type="button" className="telegram-link-button" disabled={busy} onClick={onUnlink}>Отменить привязку</button></div>
    </> : <>
      <p className="telegram-link-muted">Войдите в бота по одноразовой ссылке и вернитесь сюда для подтверждения. Пароль в чат отправлять не нужно. Поле Telegram в контактах не даёт доступа к боту.</p>
      {url ? <><a className="telegram-link-button telegram-link-primary" href={url} target="_blank" rel="noreferrer" referrerPolicy="no-referrer">Открыть бота для привязки</a><p className="telegram-link-muted">Ссылка действует 10 минут. После открытия нажмите Start в боте.</p></> : state.pending && <p className="telegram-link-muted">Ссылка уже создана. Откройте её в боте или получите новую.</p>}
      <div className="telegram-link-actions"><button type="button" className="telegram-link-button" disabled={busy} onClick={onIssue}>{state.pending ? 'Получить новую ссылку' : 'Создать ссылку для привязки'}</button>
        {state.pending && <button type="button" className="telegram-link-button" disabled={busy} onClick={onUnlink}>Отменить привязку</button>}</div>
    </>}
    {error && <p className="telegram-link-error" role="alert">{error}</p>}
  </section>;
}

export function TelegramLink() {
  const client = useQueryClient();
  const [challenge, setChallenge] = useState<TelegramChallenge | null>(null);
  const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['telegram-link', 'me'], queryFn: ({ signal }) => getTelegramLink(signal), staleTime: 0,
    refetchInterval: current => current.state.data?.pending ? 3000 : false });
  const refresh = () => client.invalidateQueries({ queryKey: ['telegram-link'] });
  const fail = (reason: Error) => { setError(reason.message); void refresh(); };
  const issue = useMutation({ mutationFn: issueTelegramLink, onSuccess: value => { setChallenge(value); setError(''); void refresh(); }, onError: fail });
  const confirm = useMutation({ mutationFn: confirmTelegramLink, onSuccess: () => { setChallenge(null); setError(''); void refresh(); }, onError: fail });
  const unlink = useMutation({ mutationFn: unlinkTelegram, onSuccess: () => { setChallenge(null); setError(''); void refresh(); }, onError: fail });
  if (query.isPending) return <p className="telegram-link-muted" role="status">Проверяем привязку Telegram…</p>;
  if (query.isError) return <section className="telegram-link"><p role="alert">{query.error.message}</p><button className="telegram-link-button" onClick={() => void query.refetch()}>Повторить</button></section>;
  const busy = issue.isPending || confirm.isPending || unlink.isPending;
  return <TelegramLinkContent state={query.data} busy={busy} error={error}
    url={challenge?.id === query.data.pending?.id ? challenge?.url : undefined}
    onIssue={() => issue.mutate()} onConfirm={() => { if (query.data.pending) confirm.mutate(query.data.pending.id); }}
    onUnlink={() => { if (!query.data.binding || window.confirm('Отключить Telegram? Бот потеряет доступ к аккаунту и перестанет присылать уведомления.')) unlink.mutate(); }} />;
}
