<template>
  <main>
    <h1>dog-watch</h1>
    <nav class="actions">
      <RouterLink :to="{ name: 'create' }">
        Crea una Stanza
      </RouterLink>
      <RouterLink :to="{ name: 'join' }">
        Entra in una Stanza
      </RouterLink>
    </nav>
  </main>
</template>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
