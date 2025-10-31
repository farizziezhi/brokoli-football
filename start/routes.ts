/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const FootballController = () => import('#controllers/football_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.group(() => {
  router.get('/predictions', [FootballController, 'predictions'])
  router.get('/fixtures', [FootballController, 'fixtures'])
  router.get('/standings', [FootballController, 'standings'])
}).prefix('/api')
