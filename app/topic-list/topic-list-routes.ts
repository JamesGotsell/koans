module topicList {
  'use strict';

  angular
    .module('topicList')
    .config(config);

  function config($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
      .state('main.home.topicList', {
        url: '/topic-list?authorId',
        templateUrl: 'topic-list/topic-list.tpl.html',
        controller: 'TopicListCtrl',
        controllerAs: 'topicList'
      });
  }
}