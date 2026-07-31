<script setup lang="ts">
const requests = [
  { name: 'Marina Costa', route: 'O melhor dos dois mundos', date: '15 set', phone: '(11) 99999-0000', value: 'R$ 1.593', status: 'Nova' },
  { name: 'João Ribeiro', route: 'Compras sem pressa', date: '02 ago', phone: '(45) 98888-1200', value: 'R$ 640', status: 'Contato' },
  { name: 'Luciana Mello', route: 'Gigantes da fronteira', date: '21 ago', phone: '(41) 97777-4570', value: 'R$ 920', status: 'Confirmada' }
]
</script>

<template>
  <main class="admin-page">
    <aside class="admin-sidebar">
      <BrandLogo />
      <nav aria-label="Navegação do painel">
        <NuxtLink class="active" to="/painel">Visão geral</NuxtLink>
        <a href="#solicitacoes">Solicitações</a>
        <NuxtLink to="/">Ver site público</NuxtLink>
      </nav>
      <p>Ambiente inicial de Marcia Marianno Machado.</p>
    </aside>
    <section class="admin-content">
      <header class="admin-title-row">
        <div>
          <p class="eyebrow">Painel do guia</p>
          <h1>Bom dia, Marcia.</h1>
          <p>Este painel demonstra como cada guia poderá gerir seus próprios roteiros no futuro.</p>
        </div>
        <ThemeToggle />
      </header>
      <div class="metric-grid">
        <article><span>Solicitações novas</span><strong>12</strong><small>+3 esta semana</small></article>
        <article><span>Experiências ativas</span><strong>3</strong><small>Com limite por grupo</small></article>
        <article><span>Previsão do mês</span><strong>R$ 8.940</strong><small>Em solicitações abertas</small></article>
      </div>
      <section id="solicitacoes" class="request-section">
        <div class="section-heading">
          <div><p class="eyebrow">Acompanhar contatos</p><h2>Últimas solicitações</h2></div>
          <button class="button button-outline button-small" type="button">Exportar lista</button>
        </div>
        <div class="requests-table" role="table" aria-label="Últimas solicitações">
          <div class="table-head" role="row"><span>Cliente</span><span>Roteiro</span><span>Data</span><span>Valor</span><span>Status</span></div>
          <div v-for="request in requests" :key="request.name" class="table-row" role="row">
            <span><b>{{ request.name }}</b><small>{{ request.phone }}</small></span><span>{{ request.route }}</span><span>{{ request.date }}</span><b>{{ request.value }}</b><span class="status" :class="request.status.toLowerCase()">{{ request.status }}</span>
          </div>
        </div>
      </section>
    </section>
  </main>
</template>
