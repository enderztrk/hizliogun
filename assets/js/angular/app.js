var app = angular.module("hizliOgun", []);

app.run(["$locale", function ($locale) {
    $locale.NUMBER_FORMATS.GROUP_SEP = ".";
    $locale.NUMBER_FORMATS.DECIMAL_SEP = ",";
}]).controller("Controller", ["$scope", "$http", "$sce", function ($scope, $http, $sce) {
    $scope.mealsCalculator = {
        meals: null,
        calories: null
    };  

    $scope.meals = {
        list: [],
        calTotal: 0
    };

    $scope.foods = [];

    const takeFoodsFromJSON = () => {
        $http.get("foods.json")
            .then(response => {
                $scope.foods = response.data;
            });
    }

    takeFoodsFromJSON();

    const calculateFoodServ = (foodCalory, exactCalory, threshold) => {
        const minCalory = exactCalory - threshold;
        const maxCalory = exactCalory + threshold;
        var multipliedFoodCalory = foodCalory;

        var serv = 1;

        while (!(multipliedFoodCalory > minCalory && multipliedFoodCalory < maxCalory) && serv != -1) {
            multipliedFoodCalory = foodCalory * serv;

            if (multipliedFoodCalory < maxCalory) {
                serv++;
            } else {
                serv = -1;
            }
        }

        return serv == -1 ? -1 : ((serv - 1) == 0 ? 1 : (serv - 1));
    }

    const pickFoodsFromJSON = (foodCount, calory, mealType) => {
        var resultFoods = [];

        const foods = $scope.foods;
        const calPerFood = calory / foodCount;
        const validCalPerFoodThreshold = ((calPerFood * 4) / 100);
        const validCalPerFood = calPerFood + validCalPerFoodThreshold;
        
        const validFoods = foods.filter(x => x.calory <= validCalPerFood && x.meals.split(",").includes(mealType.toString()));
        const validFoodsLength = validFoods.length;

        if (validFoodsLength > 0) {
            for (var i = 0; i < foodCount; i++) {
                let randomFood;
                var foodServ = -1;

                while (foodServ == -1) {
                    const randomFoodIndex = Math.floor(Math.random() * validFoodsLength) + 0;
                    randomFood = validFoods[randomFoodIndex];

                    if (resultFoods.find(x => x.title == randomFood.title) != null) {
                        foodServ = -1;
                    } else {
                        foodServ = calculateFoodServ(randomFood.calory, calPerFood, validCalPerFoodThreshold);
                    }
                }
    
                resultFoods.push({
                    title: randomFood.title,
                    calory: randomFood.calory,
                    serv: foodServ,
                    validCalory: calPerFood,
                    validCaloryThreshold: validCalPerFoodThreshold
                });
            }

            return resultFoods;
        } else {
            alert("Ürün listesi boş.");
        }

        return [];
    }

    $scope.repickFoodFromJSON = function(food, mealType) {
        const foodValidCal = food.validCalory + food.validCaloryThreshold;
        
        const validFoods = $scope.foods.filter(x => x.calory <= foodValidCal && x.meals.split(",").includes(mealType.toString()));
        const validFoodsLength = validFoods.length;

        let randomFood;
        var foodServ = -1;

        while (foodServ == -1) {
            const randomFoodIndex = Math.floor(Math.random() * validFoodsLength) + 0;
            randomFood = validFoods[randomFoodIndex];

            foodServ = calculateFoodServ(randomFood.calory, food.validCalory, food.validCaloryThreshold);
        }

        food.title = randomFood.title;
        food.calory = randomFood.calory;
        food.serv = foodServ;

        $scope.calculateTotalCal();
    }

    $scope.calculateMeals = function() {
        let resultMeals;
        const mealsCount = parseInt($scope.mealsCalculator.meals);
        const totalCalories = $scope.mealsCalculator.calories;

        switch (mealsCount) {
            case 2:
                resultMeals = [
                    {
                        title: "Kahvaltı",
                        percent: 45,
                        type: 0
                    },
                    {
                        title: "Akşam Yemeği",
                        percent: 55,
                        type: 2
                    }
                ]
                break;
            case 3:
                resultMeals = [
                    {
                        title: "Kahvaltı",
                        percent: 30,
                        type: 0
                    },
                    {
                        title: "Ara Öğün",
                        percent: 30,
                        type: 1
                    },
                    {
                        title: "Akşam Yemeği",
                        percent: 40,
                        type: 2
                    }
                ]
                break;
            case 4:
                resultMeals = [
                    {
                        title: "Kahvaltı",
                        percent: 25,
                        type: 0
                    },
                    {
                        title: "Ara Öğün",
                        percent: 20,
                        type: 1
                    },
                    {
                        title: "Akşam Yemeği",
                        percent: 35,
                        type: 2
                    },
                    {
                        title: "Atıştırmalık",
                        percent: 20,
                        type: 3
                    }
                ]
                break;
        }

        var parentCalTotal = 0;

        resultMeals.forEach(function (meal, index) {
            const foodCount = Math.floor(Math.random() * 3) + 1;
            const mealCalory = (totalCalories * meal.percent) / 100;
            
            var mealFoods = pickFoodsFromJSON(foodCount, mealCalory, meal.type);
            var calTotal = 0;

            mealFoods.forEach(food => {                
                calTotal += food.calory * food.serv;
            });

            resultMeals[index].foods = mealFoods;
            resultMeals[index].calTotal = calTotal;

            parentCalTotal += calTotal;
        });

        $scope.meals.list = resultMeals;
        $scope.meals.calTotal = parentCalTotal;
    }

    $scope.calculateTotalCal = function() {
        var meals = $scope.meals.list;
        var parentCalTotal = 0;

        meals.forEach(function (x, index) {
            var calTotal = 0;

            x.foods.forEach(f => {                
                calTotal += f.calory * f.serv;
            });

            meals[index].calTotal = calTotal;
            parentCalTotal += calTotal;
        });

        $scope.meals.list = meals;
        $scope.meals.calTotal = parentCalTotal;
    }


    //Kalori Hesabı
    $scope.calCalculator = {
        sex: null,
        height: null,
        weight: null,
        age: null,
        activity: null
    };

    $scope.calPerDay = null;

    $scope.calculateCal = function() {
        const bmr = (10 * $scope.calCalculator.weight + 6.25 * $scope.calCalculator.height - 5 * $scope.calCalculator.age + ($scope.calCalculator.sex == 1 ? 5 : - 161));
        const result = bmr * parseFloat($scope.calCalculator.activity);

        $scope.calPerDay = result;
    }

    $scope.setCalPerDayToMeals = function() {
        $scope.mealsCalculator.calories = parseFloat($scope.calPerDay.toFixed(2).replace(",", "."));

        const modalElement = document.getElementById("calCalculatorModal");
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal.toggle()
    }
}]);