describe('Authentication screen', () => {
  it('shows login and recovery options', () => {
    cy.visit('/')
    cy.contains('h1', 'Bem-vindo de volta')
    cy.contains('button', 'Esqueci minha senha')
  })
})
