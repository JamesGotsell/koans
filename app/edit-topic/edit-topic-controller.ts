///<reference path='../../typings/tsd.d.ts' />
module editTopic {
  'use strict';

  export interface IEditTopicModel{
    language:string;
    submit: Function;
    addExercise:Function;
    removeExercise:Function;
    title:string;
    items: Array<Data.IExercise>;
  }

  class EditTopicCtrl implements IEditTopicModel{

    language:string='typescript';
    title:string='';
    items: Array<Data.IExercise>=[];
    initValue:string = 'bla';
    initSolution:string ='bli';
    libsLoader = () => [];
    exercise = "test";


    submit = () => {
      var topic:Data.ITopic = new Topic(this.title,this.language);
      this.RestClient.createTopic(topic);
    };

    addExercise = () => {
      this.items.push(new Exercise());
    };

    removeExercise = (index:number) => {
      this.items.splice(index,1);
    };

    public static $inject = ['RestClient'];

    // dependencies are injected via AngularJS $injector
    constructor(private RestClient:RestClient.IRestClient) {
      this.items.push(new Exercise());
    }
  }


  /**
  * @ngdoc object
  * @name editTopic.controller:EditTopicCtrl
  *
  * @description
  *
  */
  angular
    .module('editTopic')
    .controller('EditTopicCtrl', EditTopicCtrl);
}