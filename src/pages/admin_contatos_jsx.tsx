{/* ABA: CONTATOS */}
{aba === "contatos" && (
  <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-6 py-4 border-b">
      <h2 className="font-bold text-lg">Contatos-Chave</h2>
      <div className="flex items-center gap-2">
        <button onClick={() => setAba("novo_contato")} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"><PlusCircle className="w-4 h-4" /> Novo</button>
        <button onClick={fetchContatos} className="text-muted-foreground hover:text-foreground ml-2"><RefreshCw className="w-4 h-4" /></button>
      </div>
    </div>
    {loadingContatos ? <div className="p-8 text-center text-muted-foreground">Carregando...</div> :
      contatos.length === 0 ? <div className="p-8 text-center text-muted-foreground">Nenhum contato cadastrado.</div> : (
      <div className="divide-y">
        {contatos.map((c) => (
          <div key={c.contato_id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
            {contatoEditando?.contato_id === c.contato_id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input value={contatoEdit.nome} onChange={(ev) => setContatoEdit(p => ({ ...p, nome: ev.target.value }))} placeholder="Nome" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={contatoEdit.telefone} onChange={(ev) => setContatoEdit(p => ({ ...p, telefone: ev.target.value }))} placeholder="Telefone" className="px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <input value={contatoEdit.papel} onChange={(ev) => setContatoEdit(p => ({ ...p, papel: ev.target.value }))} placeholder="Papel (ex: Coordenador Liga Diadema)" className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={contatoEdit.observacoes} onChange={(ev) => setContatoEdit(p => ({ ...p, observacoes: ev.target.value }))} placeholder="Observações" rows={2} className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <select value={contatoEdit.campeonato_id} onChange={(ev) => setContatoEdit(p => ({ ...p, campeonato_id: ev.target.value }))} className="w-full px-3 py-1.5 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Selecione o campeonato</option>
                  {campeonatos.map((camp) => <option key={camp.campeonato_id} value={camp.campeonato_id}>{camp.nome}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={salvarEdicaoContato} disabled={salvandoContato} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {salvandoContato ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                  </button>
                  <button onClick={() => setContatoEditando(null)} className="text-xs border px-2 py-1.5 rounded-lg hover:bg-muted">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.nome[0]}</div>
                  <div>
                    <p className="font-medium text-sm">{c.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.papel} · {c.telefone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.campeonato_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => abrirEdicaoContato(c)} className="text-muted-foreground hover:text-primary transition-colors" title="Editar contato"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deletarContato(c.contato_id)} className="text-destructive hover:opacity-70"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

{/* ABA: NOVO CONTATO */}
{aba === "novo_contato" && (
  <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm p-6 max-w-2xl mx-auto">
    <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Cadastrar Contato-Chave</h2>
    <div className="space-y-4">
      <div><label className="text-sm font-medium mb-1.5 block">Nome *</label><input type="text" value={novoContato.nome} onChange={(e) => setNovoContato(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Sandro Almeida" className={inputClass} /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Telefone</label><input type="text" value={novoContato.telefone} onChange={(e) => setNovoContato(p => ({ ...p, telefone: e.target.value }))} placeholder="Ex: 11999999999" className={inputClass} /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Papel</label><input type="text" value={novoContato.papel} onChange={(e) => setNovoContato(p => ({ ...p, papel: e.target.value }))} placeholder="Ex: Coordenador Liga Diadema" className={inputClass} /></div>
      <div><label className="text-sm font-medium mb-1.5 block">Campeonato *</label>
        <select value={novoContato.campeonato_id} onChange={(e) => setNovoContato(p => ({ ...p, campeonato_id: e.target.value }))} className={inputClass}>
          <option value="">Selecione o campeonato</option>
          {campeonatos.map((c) => <option key={c.campeonato_id} value={c.campeonato_id}>{c.nome}</option>)}
        </select>
      </div>
      <div><label className="text-sm font-medium mb-1.5 block">Observações</label><textarea value={novoContato.observacoes} onChange={(e) => setNovoContato(p => ({ ...p, observacoes: e.target.value }))} placeholder="Notas sobre o contato..." rows={4} className={`${inputClass} resize-none`} /></div>
      {msgContato && <p className={`text-sm font-medium ${msgContato.startsWith("✅") ? "text-green-600" : "text-destructive"}`}>{msgContato}</p>}
      <div className="flex gap-3 pt-2">
        <button onClick={criarContato} disabled={criandoContato} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"><Save className="w-4 h-4" />{criandoContato ? "Salvando..." : "Cadastrar Contato"}</button>
        <button onClick={() => setNovoContato({ nome: "", telefone: "", papel: "", observacoes: "", campeonato_id: "" })} className="flex items-center gap-2 border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"><X className="w-4 h-4" /> Limpar</button>
      </div>
    </div>
  </div>
)}
