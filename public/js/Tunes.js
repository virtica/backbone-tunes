(function($) {

	//Create an Album Model 

	window.Album = Backbone.Model.extend({

		isFirstTrack: function(index){
			return index == 0;
		},

		isLastTrack: function(index){
			return index >= this.get('tracks').length -1; 
		},

		trackUrlAtIndex: function(index){
			if(this.get('tracks').length >= index){
				return this.get('tracks')[index].url;
			}
			return null;
		}
	});

	window.Albums = Backbone.Collection.extend({
		model: Album,
		url: '/albums'
	});

	window.Playlist = Albums.extend({

		isFirstAlbum: function(index){
			return (index == 0)
		},

		isLastAlbum: function(index){
			return (index == (this.models.length -1))
		}
	});

	window.Player = Backbone.Model.extend({
		defaults: {
			'currentAlbumIndex': 0,
			'currentTrackIndex': 0,
			'state': 'stop'
		},

		initialize: function(){
			this.playlist = new Playlist();
		},
		reset: function(){
			this.set({
			'currentAlbumIndex': 0,
			'currentTrackIndex': 0,
			'state': 'stop'
		});
		},

		play: function(){
		this.set({'state':'play'});
		},
		pause: function(){
		this.set({'state':'pause'});
		},
		isPlaying: function(){
		return (this.get('state') == 'play');
		},
		isStopped: function(){
			return (!this.isPlaying);
		},

		currentAlbum: function(){
			return this.playlist.at(this.get('currentAlbumIndex'));
		},
		currentTrack: function(){
			var album = this.currentAlbum();
			return album.trackUrlAtIndex(this.get('currentTrackIndex'));
		}, 
		previousTrack: function(){
			var currentTrackIndex = this.get('currentTrackIndex'),
			currentAlbumIndex = this.get('currentAlbumIndex'),
			lastModelIndex = 0; 
			if (this.currentAlbum().isFirstTrack(currentTrackIndex)){
				if(this.playlist.isFirstAlbum(currentAlbumIndex)){
				lastModelIndex = this.playlist.models.length - 1; 
				this.set({'currentAlbumIndex': lastModelIndex});
			}else{
				this.set({'currentAlbumIndex': currentAlbumIndex - 1});
			}

			var lastTrackIndex = this.currentAlbum().get('track').length - 1;
			this.set({'currentTrackIndex': lastTrackIndex});
		}else{
			this.set({'currentTrackIndex': currentTrackIndex - 1 });
		}
		this.logCurrentAlbumTrack();
	},
	nextTrack: function(){
		var currentTrackIndex  = this.get('currentTrackIndex'),
		currentAlbumIndex = this.get('currentAlbumIndex');
		if(this.currentAlbum().isLastTrack(currentTrackIndex)){
			if(this.playlist.isLastAlbum(currentAlbumIndex)){
				this.set({
					'currentAlbumIndex': 0
				});
				this.set({
					'currentTrackindex': 0 
				});

			}else{
				this.set({
					'currentAlbumIndex': currentAlbumIndex + 1 
				});
				this.set({
					'currentTrackIndex': 0
				});
			}
		}else{
			this.set({ 
				'currentTrackIndex': currentTrackIndex + 1 
			});
		}
	}
	});

	window.library = new Albums();
	window.player = new Player(); 

	window.AlbumView = Backbone.View.extend({
		tagName: 'li',
		className: 'album',

		initialize: function(){
			_.bindAll(this, 'render');
			this.model.bind('change',this.render);
			this.template = _.template($('#album-template').html());
		},

		render: function(){
			var renderedContent = this.template(this.model.toJSON());
			$(this.el).html(renderedContent);
			return this;
		}

	});

	window.LibraryAlbumView = AlbumView.extend({
		events: {
			'click .queue.add': 'select'
		},
		select: function(){
			this.collection.trigger('select', this.model);
			
		}
	});

	window.PlaylistAlbumView = AlbumView.extend({});

	window.PlaylistView = Backbone.View.extend({
		tagname: 'section',
		className: 'playlist',

		initialize: function(){
			_.bindAll(this, 'render', 'queueAlbum', 'renderAlbum');
			this.template = _.template($('#playlist-template').html());
			this.collection.bind('reset', this.render);
			this.collection.bind('add',this.renderAlbum);

			this.player = this.options.player;
			this.library = this.options.library;
			this.library.bind('select', this.queueAlbum);
		},
		render: function(){
			$(this.el).html(this.template(this.player.toJSON()));

			this.$('button play').toggle(this.player.isStopped());
			this.$('button pause').toggle(this.player.isPlaying());

			return this;
		}, 
		queueAlbum: function(album){
			this.collection.add(album);
		},
		renderAlbum: function(album){
			var view = new PlaylistAlbumView({
				model: album,
				player: this.player,
				playlist: this.collection
			});
			this.$('ul').append(view.render().el);

		}
	});

	window.LibraryView = Backbone.View.extend({
		tagName: 'section',
		className: 'library',
		
		initialize: function(){
		_.bindAll(this, 'render');
		this.template = _.template($('#library-template').html());
		this.collection.bind('reset', this.render);
		},
		render: function(){

			var $albums,
			collection = this.collection;
			$(this.el).html(this.template({}));
			$albums = this.$('.albums');
			collection.each(function(album){
			var view = new LibraryAlbumView({
			model: album,
			collection: collection
		});
		$albums.append(view.render().el)
	});
		return this;
}
	});

	window.BackboneTunes = Backbone.Router.extend({

		routes: {
			'': 'home',
			'blank': 'blank'
		},

		initialize: function(){
			this.libraryView = new LibraryView({
				collection: window.library
			});
			this.playlistView  = new PlaylistView({
				collection: window.player.playlist,
				player: window.player,
				library: window.library
			});
		},
		home: function() { 
			var $container = $('#container');
			$container.empty();
			$container.append(this.playlistView.render().el);
			$container.append(this.libraryView.render().el);
			

		}, 
		blank: function(){
			$('#container').empty();
			$('#container').text('blank');
		}
	}); 
	$(function(){
		window.App = new BackboneTunes();
		Backbone.history.start();
	});

})(jQuery);
