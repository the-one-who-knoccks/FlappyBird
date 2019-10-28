
 
   // DEFINIÇÃO DAS VARIAVES 

   
   // MODO DE DEPURAÇÃO DO GAME - LÓGICO ( TRUE OU FALSE)
   var debugmode = false;

   // OBJETO PARA CONGELAR OS PARAMATROS DE UM ELEMENTO
   var states = Object.freeze({
      SplashScreen: 0,
      GameScreen: 1,
      ScoreScreen: 2
   });

   // VARIÁVEIS DE LÓGICA
   var currentstate;
   var gravity = 0.25;
   var velocity = 0;
   var position = 180;
   var rotation = 0;
   var jump = -4.6;

   // VARIÁVEIS DE PONTUAÇÃO MIN E MAX
   var score = 0;
   var highscore = 0;

   // Definição das vars do cano
   var pipeheight = 90;
   var pipewidth = 52;
   var pipes = new Array();

   // VARIAVEL DE REPLAY
   var replayclickable = false;

   // VARIÁVEIS DE DEFINIÇÕES DE AUDIOS
   var volume = 30;
   var soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg");
   var soundScore = new buzz.sound("assets/sounds/sfx_point.ogg");
   var soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg");
   var soundDie = new buzz.sound("assets/sounds/sfx_die.ogg");
   var soundSwoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg");
   buzz.all().setVolume(volume);

   // LOOPS DO JOGO E DOS CANOS
   var loopGameloop;
   var loopPipeloop;

   // FUNÇÕES
   // DEPURAÇÃO DO JOGO APÓS CARREGAR O GAME
   $(document).ready(function() {
      if(window.location.search == "?debug")
         debugmode = true;
      if(window.location.search == "?easy")
         pipeheight = 200;
      
      // FUNÇÃO DE CAPTURA DO COOKIE QUE IRÁ MOSTRAR O SCORE
      var savedscore = getCookie("highscore");
      if(savedscore != "") 
         highscore = parseInt(savedscore); 
      
      // Começar com a tela inicial
      showSplash();
   });

/* 
   /// FUNÇÕES DO JOGO ////
*/

   // FUNÇÃO DE CAPTURA DO COOKIE QUE IRÁ MOSTRAR O SCORE
   function getCookie(cname)
   {
      var name = cname + "=";
      var ca = document.cookie.split(';');
      for(var i=0; i< ca.length; i++) 
      {
         var c = ca[i].trim();
         if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
      }
      return "";
   }

   // FUNÇÃO DE SET DO COOKIE, VALOR, NOME E TEMPO DE VALIDADE
   function setCookie(cname,cvalue,exdays)
   {
      var d = new Date();
      d.setTime(d.getTime()+(exdays*24*60*60*1000));
      var expires = "expires="+d.toGMTString();
      document.cookie = cname + "=" + cvalue + "; " + expires;
   }

   // FUNÇÃO DE INICIALIZAÇÃO DA SPLASH SCREEN
   function showSplash()
   {
      // VARIAVEL DE ARMAZENAMENTO DO ESTADO DO JOGO E TRATAR OS EVENTOS
      currentstate = states.SplashScreen;
      
      // VALORES INICIAIS
      velocity = 0;
      position = 180;
      rotation = 0;
      score = 0;
      
      // RESET DAS POSIÇÕES DO PLAYER PARA UM NOVO JOGO
      $("#player").css({ y: 0, x: 0});
      updatePlayer($("#player"));
      
      soundSwoosh.stop();
      soundSwoosh.play();
      
      // RESETA OS CANOS PARA INICIALIZAÇÃO DO JOGO
      $(".pipe").remove();
      pipes = new Array(); // DETERMINARÁ POSIÇÕES DIFERENTES DOS CANOS/PIPES
      
      // INICIALIZ. DAS ANIMAÇÕES DE SPRITES NOVAMENTE
      $(".animated").css('animation-play-state', 'running');
      $(".animated").css('-webkit-animation-play-state', 'running');
      
      // FADE DA SPLASH SCREEN
      $("#splash").transition({ opacity: 1 }, 2000, 'ease');
   }

   // FUNÇÃO DE INICIO DO GAME
   function startGame()
   {
      // VARIAVEL DE ARMAZENAMENTO DO ESTADO DO JOGO
      currentstate = states.GameScreen;
      
      // FADE PARA ESCONDER A SPLASH SCREEN 
      $("#splash").stop();
      $("#splash").transition({ opacity: 0 }, 500, 'ease');
      
      // MOSTRA O SCORE DO JOGO EM TEMPO REAL
      setBigScore();
      
      // DEBUG MODE QUE CONSIDERA AS BORDAS AO REDOR
      if(debugmode)
      {
         $(".boundingbox").show(); // COMPUTA O ENCONTRO DOS PIXELS FAZENDO ASSIM A PONTUAÇÃO DO GAME
      }

      // INICIO DE LOOP DO JOGO. AUMENTA O TEMPO E A DIFICULDADE DO GAME CONFORME O TEMPO DO JOGO
      var updaterate = 1000.0 / 60.0 ; // 60 fps
      loopGameloop = setInterval(gameloop, updaterate);
      loopPipeloop = setInterval(updatePipes, 1400);
      
      // AÇÃO DE PULO QUE DARÁ INICIO AO JOGO
      playerJump();
   }

   // FUNÇÃO QUE IRÁ CARREGAR A VELOCIDADE E A ROTAÇÃO DO PLAYER
   function updatePlayer(player)
   {
      // ROTAÇÃO
      rotation = Math.min((velocity / 10) * 90, 90);
      
      // ROTAÇÃO POR CSS (X Y)
      $(player).css({ rotate: rotation, top: position });
   }

   // FUNÇÃO DE GAME LOOP
   function gameloop() {

      var player = $("#player");
      
      // CARREGA A VELOCIDADE E POSIÇÃO DO PLAYER
      velocity += gravity;
      position += velocity;
      
      // ATUALIZAÇÃO DOS NOVOS VALORES DO PLAYER
      updatePlayer(player);
      
      // HACK DE BOUNDING BOX PARA O PLAYER
      var box = document.getElementById('player').getBoundingClientRect();
      var origwidth = 34.0;
      var origheight = 24.0;
      
      var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
      var boxheight = (origheight + box.height) / 2;
      var boxleft = ((box.width - boxwidth) / 2) + box.left;
      var boxtop = ((box.height - boxheight) / 2) + box.top;
      var boxright = boxleft + boxwidth;
      var boxbottom = boxtop + boxheight;
     
      // AO ACERTAR O FOOTER, O PLAYER MORRE E REINICIA O JOG
      if(box.bottom >= $("#footer-game").offset().top)
      {
         playerDead();
         return;
      }
      
      // SE TENTAR PASSAR PELO TOPO, ZERA A POSIÇÃO DO PLAYER
      var ceiling = $("#ceiling");
      if(boxtop <= (ceiling.offset().top + ceiling.height()))
         position = 0;
      
      // CASO NÃO HAJA NENUM CANO NO GAME, ELE RETORNA
      if(pipes[0] == null)
         return;
      
      // DETERMINAR A ÁREA PARA OS PRÓX. CANOS
      var nextpipe = pipes[0];
      var nextpipeupper = nextpipe.children(".pipe_upper");
      
      var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
      var pipeleft = nextpipeupper.offset().left - 2; // Por algum motivo ele começa no deslocamento dos tubos internos , e não os tubos exteriores 
      var piperight = pipeleft + pipewidth;
      var pipebottom = pipetop + pipeheight;
      
      // DETERMINA A AÇÃO QUE ACONTECE AO CAIR DENTRO DO CANO
      if(boxright > pipeleft)
      {
               // ESTANDO DENTRO DO TUBO, JA PASSAMOS PELO TUBO SUPERIOR E INFERIOR
         if(boxtop > pipetop && boxbottom < pipebottom)
         {
            // sim, estamos dentro dos limites!
            
         }
         else
         {
            // não podemos pular estando dentro do cano, você morreu! return game!
            playerDead();
            return;
         }
      }
      
      
      // SE JÁ PASSOU O CANO (VALIDAÇÃO)
      if(boxleft > piperight)
      {
         // SE PASSOU, IRÁ REMOVER E APARECERÁ OUTRO
         pipes.splice(0, 1);
         
         // PONTUAÇÃO A PARTIR DO MOMENTO QUE O PLAYER PASSA PELO CANO
         playerScore();
      }
   }

   // PULOS COM A BARRA DE ESPAÇO OU INICIO DO GAME
   $(document).keydown(function(e){
     
      // USANDO A BARRA DE ESPAÇO 
      if(e.keyCode == 32)
      {
         // USANDO O SPACE PARA RECOMEÇAR O JOGO
         if(currentstate == states.ScoreScreen)
            $("#replay").click();
         else
            screenClick();
      }
   });
 
   // FUNÇÃO QUE RETORNA O PULO E SOM DO JOGO
   if("ontouchstart" in window)
      $(document).on("touchstart", screenClick);
   else
      $(document).on("mousedown", screenClick);

   function screenClick()
   {
      if(currentstate == states.GameScreen)
      {
         playerJump();
      }
      else if(currentstate == states.SplashScreen)
      {
         startGame();
      }
   }

   // FUNÇÃO QUE RETORNA O PULO E SOM DO JOGO
   function playerJump()
   {
      velocity = jump;
      // INICIO DO SOM DO PULO
      soundJump.stop();
      soundJump.play();
   }

   // FUNÇÃO DE SET DA PONTUAÇÃO E IMAGEM DE PONTUAÇÃO
   function setBigScore(erase)
   {
      var elemscore = $("#bigscore");
      elemscore.empty();
      
      if(erase)
         return;
      
      var digits = score.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   // FUNÇÃO DE SET DO SMALL SCORE(PONTUAÇÃO) E IMAGEM DE PONTUAÇÃO
   function setSmallScore()
   {
      // SETA O SCORE OBTIDO PELO JOGADOR COM A IMAGEM PEQUENA
      var elemscore = $("#currentscore");
      elemscore.empty();
      
      var digits = score.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   // FUNÇÃO DE SET DO HIGH SCORE(PONTUAÇÃO) E IMAGEM DE PONTUAÇÃO
   function setHighScore()
   
   {   
      // SETA O MAIOR SCORE JÁ OBTIDO PELO JOGADOR E RETORNA NA TELA
      var elemscore = $("#highscore");
      elemscore.empty();
      
      var digits = highscore.toString().split('');
      for(var i = 0; i < digits.length; i++)
         elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
   }

   // FUNÇÃO DE SET DA MEDALHA DE ACORDO COM OS PONTOS OBTIDOS
   function setMedal()
   {
      var elemmedal = $("#medal");
      elemmedal.empty();
      
      if(score < 10)
         // RETORNA NENUMA MEDELHA
         return false;
      
      if(score >= 10)
         medal = "bronze";
      if(score >= 20)
         medal = "silver";
      if(score >= 30)
         medal = "gold";
      if(score >= 40)
         medal = "platinum";
      
      elemmedal.append('<img src="assets/medal_' + medal +'.png" alt="' + medal +'">');
      
      // RETORNA A MEDALHA OBTIDA
      return true;
   }

   // FUNÇÃO DA MORTE DO PLAYER
   function playerDead()
   {
      // PAUSANDO AS ANIMAÇÕES (TODAS)
      $(".animated").css('animation-play-state', 'paused');
      $(".animated").css('-webkit-animation-play-state', 'paused');
      
      // DROP DO PASSARO NO FOOTER
      var playerbottom = $("#player").position().top + $("#player").width(); // Usamos porque ele irá rotacionar 90º
      var floor = $("#flyarea-game").height();
      var movey = Math.max(0, floor - playerbottom);
      $("#player").transition({ y: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');
      
      
      currentstate = states.ScoreScreen;

      // DESTROI TODOS OS LOOPS DO GAME
      clearInterval(loopGameloop);
      clearInterval(loopPipeloop);
      loopGameloop = null;
      loopPipeloop = null;

      // MOBILE BROWSERS QUE NÃO SUPORTAM BUZZ BINDONCE EVENT
      if(isIncompatible.any())
      {
         // MOSTRA O SCORE
         showScore();
      }
      else
      {
         // INICIO DO HIT SOUND E DEPOIS O SOM DE PLAYER DEADTH E MOSTRA O SCORE
         soundHit.play().bindOnce("ended", function() {
            soundDie.play().bindOnce("ended", function() {
               showScore();
            });
         });
      }
   }

   // FUNÇÃO QUE SETA O SCORE FINAL
   function showScore()
   {
      // EXIBE O QUADRO DE SCORE
      $("#scoreboard").css("display", "block");
      
      // REMOVE O BIG SCORE DA TELA
      setBigScore(true);
      
      // // ATUALIZAÇÃO DO QUADRO DE SCORE PELA MAIOR PONTUAÇÃO OBITDA
      if(score > highscore)
      {
         // ARMAZENA O SCORE
         highscore = score;
         // SALVA NO COOKIE
         setCookie("highscore", highscore, 999);
      }
      
      // ALTERA O QUADRO DE SCORE
      setSmallScore();
      setHighScore();
      var wonmedal = setMedal();
      
      // SOM DE SWOOSH
      soundSwoosh.stop();
      soundSwoosh.play();
      
      // EXIBIÇÃO DO QUADRO DE SCORE
      $("#scoreboard").css({ y: '40px', opacity: 0 }); // Move o quadro de score para biaxo
      $("#replay").css({ y: '40px', opacity: 0 });
      $("#scoreboard").transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
         // VALIDAÇÃO DO TERMINO DA ANIMAÇÃO E COMEÇAR O SOUN SWOOSH
         soundSwoosh.stop();
         soundSwoosh.play();
         $("#replay").transition({ y: '0px', opacity: 1}, 600, 'ease');
         
         // VALIDAÇÃO SE EXISTE MEDALHA PARA APARECER NO QUADRO
         if(wonmedal)
         {
            $("#medal").css({ scale: 2, opacity: 0 });
            $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
         }
      });
      
      // MOSTRAR O BOTÃO DE REPLAY (CLICAVEL)
      replayclickable = true;
   }

   $("#replay").click(function() {
      // DEIXAR A AÇÃO DE REPLAY COM CLICK
      if(!replayclickable)
         return;
      else
         replayclickable = false;
      //SWOOSH!
      soundSwoosh.stop();
      soundSwoosh.play();
      
      // FUNÇÃO FADE QUE OCULTA O QUADRO
      $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
         // OCULTA O SCORE BOARD
         $("#scoreboard").css("display", "none");
         
         // MOSTRA O GAME OVER E EXIBE A TELA DE SPLASH SCREEN
         showSplash();
      });
   });

   // FUNÇÃO DE ARMAZENAMENTO DA PONTUAÇÃO DO PLAYER
   function playerScore()
   {
      score += 1;
      soundScore.stop();
      soundScore.play();
      setBigScore();
   }

   // FUNÇÃO QUE EXIBE OS CANOS
   function updatePipes()
   {
      // FUNÇÃO QUE EXIBE OS CANOS
      $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()
      
      // ADICIONA UM NOVO CANO E COLOCA O CANO EM OUTRA ÁREA
      var padding = 80;
      var constraint = 420 - pipeheight - (padding * 2); // duplicando a margem interna
      var topheight = Math.floor((Math.random()*constraint) + padding); // add padding abaixo
      var bottomheight = (420 - pipeheight) - topheight;
      var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
      $("#flyarea-game").append(newpipe);
      pipes.push(newpipe);
   }

   // E POR ULTIMO, AQUI DEFINIMOS O SUPORTE PARA OS NAVEGADORES PARA O EVENTO DE BUZZ
   var isIncompatible = {
         Android: function() {
         return navigator.userAgent.match(/Android/i);
         },
         BlackBerry: function() {
         return navigator.userAgent.match(/BlackBerry/i);
         },
         iOS: function() {
         return navigator.userAgent.match(/iPhone|iPad|iPod/i);
         },
         Opera: function() {
         return navigator.userAgent.match(/Opera Mini/i);
         },
         Safari: function() {
         return (navigator.userAgent.match(/OS X.*Safari/) && ! navigator.userAgent.match(/Chrome/));
         },
         Windows: function() {
         return navigator.userAgent.match(/IEMobile/i);
         },
         any: function() {
         return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
         }
   };